import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useDropzone } from 'react-dropzone'
import { dataService } from '../api/dataService'
import { calculateEmission } from '../utils/calculateScore'
import { useAuth } from '../context/AuthContext'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import ScopeTooltip from '../components/ScopeTooltip'
import toast from 'react-hot-toast'
import CountUpModule from 'react-countup'
const CountUp = CountUpModule.default || CountUpModule

const businessTypeOptions = [
  'Bakery', 'Restaurant', 'Supermarket', 'Pharmacy', 'FuelStation',
  'SmallShop', 'ISP', 'Hardware Store', 'Consulting', 'Gym',
  'Call Center', 'E-Commerce', 'Solar Installer', 'Real Estate',
  'Insurance Broker', 'Art Gallery', 'Laundromat', 'Software Dev',
  'Law Firm', 'Logistics Hub', 'Advertising Agency', 'Veterinary Clinic', 'Data Center'
]

const ACTIVITY_MAPPINGS = {
  business_travel: {
    car: 0.225,
    flight: 0.150,
    motorbike: 0.112
  },
  commute: {
    bus: 0.090,
    car_petrol: 0.225,
    delivery_van: 0.315,
    motorbike: 0.112
  },
  electricity: {
    air_conditioning: 0.359,
    electricity_consumption: 0.359
  },
  fuel: {
    LPG: 3.010,
    diesel: 2.680,
    diesel_generator: 2.670,
    petrol: 2.330
  },
  transport: {
    bus: 0.090,
    car_diesel: 0.201,
    car_petrol: 0.225,
    delivery_transport: 0.210,
    delivery_van: 0.315,
    motorbike: 0.112
  },
  waste: {
    food_composting: 0.200,
    food_landfill: 1.400,
    paper_landfill: 1.000,
    paper_recycling: -0.400,
    plastic_landfill: 2.500,
    plastic_recycling: -0.400,
    solid_waste: 1.500
  },
  water: {
    wastewater_centralized: 0.272,
    wastewater_unmanaged: 0.708,
    water_supply: 0.344
  }
}

const defaultsForCategory = (source_category) => {
  const cat = source_category.toLowerCase()
  const mapping = ACTIVITY_MAPPINGS[cat] || {}
  const firstActivity = Object.keys(mapping)[0] || 'activity'
  const firstFactor = mapping[firstActivity] || 0

  let unit = ''
  let scope = 'Scope 3'

  switch (cat) {
    case 'electricity':
      unit = 'kWh'; scope = 'Scope 2'; break;
    case 'fuel':
      unit = 'litres'; scope = 'Scope 1'; break;
    case 'transport':
      unit = 'km'; scope = 'Scope 3'; break;
    case 'waste':
      unit = 'kg'; scope = 'Scope 3'; break;
    case 'water':
      unit = 'm3'; scope = 'Scope 3'; break;
    case 'commute':
    case 'business_travel':
      unit = 'passenger-km'; scope = 'Scope 3'; break;
    default:
      unit = ''; scope = 'Scope 3'; break;
  }

  return { unit, emission_factor: firstFactor, activity: firstActivity, scope }
}

export default function AddEmission() {
  const navigate = useNavigate()
  const existingBusinessId = localStorage.getItem('business_id')
  const queryClient = useQueryClient()
  const { user, isAuthenticated } = useAuth()

  const [rows, setRows] = useState([{
    business_type: '',
    source_category: 'electricity',
    date: new Date().toISOString().slice(0, 10),
    amount: '',
    unit: 'kWh',
    emission_factor: 0.359,
    activity: 'electricity_consumption',
    scope: 'Scope 2',
    emission_total: 0,
  }])

  // Calculate total emissions preview
  const totalEmissions = rows.reduce((acc, r) => {
    return acc + calculateEmission(r.amount, r.emission_factor)
  }, 0)

  // Upload CSV mutation
  const { mutate: uploadCSV, isPending: isUploading } = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData()
      formData.append('file', file)
      // The client.js interceptor returns response.data directly
      const data = await dataService.uploadCSV(formData)
      return data
    },
    onSuccess: (data) => {
      toast.success(`Successfully uploaded ${data.rows || 0} entries!`)
      // Note: Backend upload endpoint doesn't return business_id in the top level response
      // It returns { success: true, rows: N }
      // If we need business_id, we might need to fetch dashboard or rely on user input
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['insights'] })
      navigate('/app/dashboard')
    },
    onError: (error) => {
      // Error handled by client.js interceptor toast, but we can add specific handling here if needed
      console.error("Upload failed", error)
    },
  })

  // Manual entry mutation
  const submitEntry = async (entry, useBusinessId = null) => {
    const payload = {
      business_id: useBusinessId,
      // ... payload fields
    }
    // We don't construct payload here, it's done in handleSubmit loop or below.
    // Wait, this function 'submitEntry' is defined but NOT USED in the provided file content?
    // Let me check 'handleSubmit'.
    // Ah, 'submitEntry' is defined at line 142 but I don't see it used in 'handleSubmit' logic which manually constructs payload.
    // I will ignore 'submitEntry' function if it's unused, or update it if I see it used.
    // Looking at line 251 in original file, 'handleSubmit' does manual construction.
    // So I will update 'handleSubmit' directly.
  }

  // CSV Dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        uploadCSV(acceptedFiles[0])
      }
    },
    multiple: false,
  })

  useEffect(() => {
    // Check for pending row from AI Calculator
    try {
      const pending = localStorage.getItem('pending_row')
      if (pending) {
        const r = JSON.parse(pending)
        const defaults = defaultsForCategory(r.source_category || 'electricity')
        setRows((prev) => [...prev, {
          ...r,
          unit: r.unit || defaults.unit,
          emission_factor: r.emission_factor || defaults.emission_factor,
          activity: r.activity || defaults.activity,
          scope: r.scope || defaults.scope,
          emission_total: calculateEmission(r.amount, r.emission_factor || defaults.emission_factor),
        }])
        localStorage.removeItem('pending_row')
      }
    } catch { }
  }, [])

  const addRow = () => {
    const defaults = defaultsForCategory('electricity')
    setRows((prev) => [...prev, {
      business_type: '',
      source_category: 'electricity',
      date: new Date().toISOString().slice(0, 10),
      amount: '',
      unit: defaults.unit,
      emission_factor: defaults.emission_factor,
      activity: defaults.activity,
      scope: defaults.scope,
      emission_total: 0,
    }])
  }

  const removeRow = (idx) => {
    setRows((prev) => prev.filter((_, i) => i !== idx))
  }

  const updateRow = (idx, field, value) => {
    setRows((prev) => prev.map((r, i) => {
      if (i !== idx) return r
      const updated = { ...r, [field]: value }

      if (field === 'source_category') {
        const d = defaultsForCategory(value)
        updated.unit = d.unit
        updated.emission_factor = d.emission_factor
        updated.activity = d.activity
        updated.scope = d.scope
      } else if (field === 'activity') {
        const mapping = ACTIVITY_MAPPINGS[updated.source_category] || {}
        if (mapping[value] !== undefined) {
          updated.emission_factor = mapping[value]
        }
      }

      const ef = Number(updated.emission_factor || 0)
      const amt = Number(updated.amount || 0)
      updated.emission_total = calculateEmission(amt, ef)
      return updated
    }))
  }

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    // Validate all rows
    for (const r of rows) {
      if (!r.business_type || !r.source_category || !r.date || !r.amount || !r.emission_factor) {
        toast.error('Please complete all required fields, including Emission Factor.')
        return
      }
    }

    setIsSubmitting(true)
    let generatedBusinessId = existingBusinessId || null

    try {
      if (rows.length === 1) {
        const row = rows[0]
        const payload = {
          business_id: generatedBusinessId,
          business_type: row.business_type,
          date: row.date,
          source_category: row.source_category,
          activity: row.activity,
          amount: Number(row.amount),
          unit: row.unit,
          emission_factor: Number(row.emission_factor),
          scope: row.scope,
        }
        // Pass user.uid if logged in (or null if guest)
        const data = await dataService.addManualEntry(payload, user?.uid)
        if (!generatedBusinessId && data.business_id && data.business_id !== 'guest_local') {
          localStorage.setItem('business_id', data.business_id)
          if (row.business_type) localStorage.setItem('business_name', row.business_type)
        }
      } else {
        const payload = {
          entries: rows.map(row => ({
            business_id: generatedBusinessId,
            business_type: row.business_type,
            date: row.date,
            source_category: row.source_category,
            activity: row.activity,
            amount: Number(row.amount),
            unit: row.unit,
            emission_factor: Number(row.emission_factor),
            scope: row.scope,
          })),
          generate_if_missing: true
        }
        const data = await dataService.addBulkEmissions(payload, user?.uid)
        // Bulk response: { success: true, count: N }
        // We don't get business_id back for bulk, so we can't set it here if it was missing.
        // However, if we didn't have one, the backend generated one for each entry.
        // We might want to just redirect.
        if (!generatedBusinessId && rows[0].business_type) {
          localStorage.setItem('business_name', rows[0].business_type)
        }
      }

      toast.success(`Successfully added ${rows.length} ${rows.length === 1 ? 'entry' : 'entries'}!`)

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        queryClient.invalidateQueries({ queryKey: ['insights'] })
        navigate('/app/dashboard')
      }, 1000)
    } catch (error) {
      // Error handled by client.js
      console.error("Submit failed", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Smart Entry</h1>
        <p className="text-slate-600">Add emissions manually or upload a CSV file</p>
      </div>

      {/* Info Banner */}
      <Card className="bg-emerald-50 border-emerald-200">
        <div className="card-content">
          <div className="flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-emerald-900 mb-1">
                No Business ID Required
              </p>
              <p className="text-sm text-emerald-700">
                You can enter emissions even if your business has not been created. We will generate a business ID automatically when you submit your first entry.
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* CSV Upload Zone - Only for Logged In Users */}
          <Card>
            <div className={`card-content ${!isAuthenticated ? 'opacity-50 pointer-events-none relative' : ''}`}>
              {!isAuthenticated && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-50/50 backdrop-blur-[1px] rounded-xl">
                  <p className="text-sm font-medium text-slate-900 bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200">
                    Sign in to use CSV Upload
                  </p>
                </div>
              )}
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Upload CSV File
              </h3>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${isDragActive
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50'
                  }`}
              >
                <input {...getInputProps()} />
                {isUploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <svg
                      className="animate-spin h-8 w-8 text-emerald-600"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <p className="text-sm text-slate-600">Uploading...</p>
                  </div>
                ) : (
                  <>
                    <svg
                      className="mx-auto h-12 w-12 text-slate-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <p className="mt-2 text-sm text-slate-600">
                      {isDragActive
                        ? 'Drop the CSV file here'
                        : 'Drag and drop a CSV file, or click to select'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Required columns: business_type, source_category, amount. Business ID is optional.
                    </p>
                  </>
                )}
              </div>
            </div>
          </Card>

          {/* Manual Entry Form */}
          <Card>
            <div className="card-content">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-900">
                  Manual Entry
                </h3>
                <Button variant="secondary" onClick={addRow}>
                  Add Row
                </Button>
              </div>

              <div className="space-y-4">
                {rows.map((row, idx) => {
                  const rowTotal = calculateEmission(row.amount, row.emission_factor)
                  return (
                    <div
                      key={idx}
                      className="p-4 border border-slate-200 rounded-lg space-y-3"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Business Type *
                          </label>
                          <select
                            className="input"
                            value={row.business_type}
                            onChange={(e) => updateRow(idx, 'business_type', e.target.value)}
                            required
                          >
                            <option value="">Select type</option>
                            {businessTypeOptions.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Source Category *
                          </label>
                          <select
                            className="input"
                            value={row.source_category}
                            onChange={(e) => updateRow(idx, 'source_category', e.target.value)}
                            required
                          >
                            <option value="electricity">Electricity</option>
                            <option value="fuel">Fuel</option>
                            <option value="transport">Transport</option>
                            <option value="waste">Waste</option>
                            <option value="water">Water</option>
                            <option value="commute">Commute</option>
                            <option value="business_travel">Business Travel</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Date *
                          </label>
                          <input
                            type="date"
                            className="input"
                            value={row.date}
                            onChange={(e) => updateRow(idx, 'date', e.target.value)}
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Amount *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            className="input"
                            value={row.amount}
                            onChange={(e) => updateRow(idx, 'amount', e.target.value)}
                            placeholder="0.00"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Unit
                          </label>
                          <input
                            type="text"
                            className="input"
                            value={row.unit}
                            onChange={(e) => updateRow(idx, 'unit', e.target.value)}
                            placeholder="e.g., kWh, kg, km"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                            Emission Factor (kgCO₂e per unit) *
                            <div className="group relative">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-slate-400 cursor-help">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                              </svg>
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                If unsure, leave blank — system will use default factors based on category.
                              </div>
                            </div>
                          </label>
                          <input
                            type="number"
                            step="0.001"
                            className="input border-2 border-emerald-200 focus:border-emerald-500"
                            value={row.emission_factor}
                            onChange={(e) => updateRow(idx, 'emission_factor', e.target.value)}
                            placeholder="0.000"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            Activity
                          </label>
                          <select
                            className="input"
                            value={row.activity}
                            onChange={(e) => updateRow(idx, 'activity', e.target.value)}
                            required
                          >
                            {Object.keys(ACTIVITY_MAPPINGS[row.source_category] || {}).map((act) => (
                              <option key={act} value={act}>
                                {act.replace(/_/g, ' ')}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center">
                            Scope
                            <ScopeTooltip />
                          </label>
                          <select
                            className="input"
                            value={row.scope}
                            onChange={(e) => updateRow(idx, 'scope', e.target.value)}
                          >
                            <option value="Scope 1">Scope 1</option>
                            <option value="Scope 2">Scope 2</option>
                            <option value="Scope 3">Scope 3</option>
                          </select>
                        </div>
                      </div>

                      {/* Live Calculation Display */}
                      {row.amount && row.emission_factor && (
                        <div className="pt-3 border-t border-slate-200 bg-emerald-50 rounded-lg p-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-xs text-slate-600 mb-1">Live Calculation</p>
                              <p className="text-sm text-slate-700">
                                {Number(row.amount).toFixed(2)} {row.unit} × {Number(row.emission_factor).toFixed(3)} kgCO₂e/unit
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-slate-600 mb-1">Total Emissions</p>
                              <p className="text-lg font-bold text-emerald-700">
                                {rowTotal.toFixed(2)} kgCO₂e
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {rows.length > 1 && (
                        <div className="flex justify-end pt-2">
                          <Button
                            variant="secondary"
                            onClick={() => removeRow(idx)}
                            className="text-sm"
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="mt-6 flex gap-3">
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  loading={isSubmitting}
                  disabled={rows.length === 0}
                >
                  Submit {rows.length === 1 ? 'Entry' : 'All Entries'}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Preview Sidebar */}
        <div className="lg:col-span-1">
          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 sticky top-20">
            <div className="card-content">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                CO₂ Preview
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-600 mb-2">Total Entries</p>
                  <p className="text-2xl font-bold text-slate-900">{rows.length}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-2">Total Emissions</p>
                  <div className="flex items-baseline gap-2">
                    <CountUp
                      end={totalEmissions}
                      duration={0.5}
                      decimals={2}
                      className="text-3xl font-bold text-emerald-700"
                    />
                    <span className="text-lg text-slate-600">kgCO₂e</span>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-200">
                  <p className="text-xs text-slate-500">
                    * Required fields must be completed before submission
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Business ID will be generated automatically
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
