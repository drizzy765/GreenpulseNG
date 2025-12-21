import { useEffect, useState } from 'react'
import { dataService } from '../api/dataService'
import { useAuth } from '../context/AuthContext'
import { Box, Typography, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export default function Emissions() {
  const businessId = localStorage.getItem('business_id')
  const { user } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await dataService.getEmissions(encodeURIComponent(businessId), user?.uid)
      // Handle both direct response and response.data formats
      const data = response?.data || response
      setRows(data?.rows || data || [])
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load emissions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [businessId, user?.uid])

  const groupedByCategory = () => {
    const map = new Map()
    rows.forEach(r => {
      const key = r.source_category || 'unknown'
      const val = Number(r.emissions_kgCO2e || 0)
      map.set(key, (map.get(key) || 0) + val)
    })
    const labels = Array.from(map.keys())
    const values = labels.map(l => map.get(l))
    return { labels, values }
  }

  const chartData = (() => {
    const { labels, values } = groupedByCategory()
    return {
      labels,
      datasets: [{
        label: 'Emissions (kgCO₂e)',
        data: values,
        backgroundColor: '#007f5f',
      }],
    }
  })()

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Emission History</Typography>
      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
      <Bar data={chartData} />
      <Table size="small" sx={{ mt: 2 }}>
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Source Category</TableCell>
            <TableCell>Activity</TableCell>
            <TableCell align="right">Amount</TableCell>
            <TableCell>Unit</TableCell>
            <TableCell align="right">Emission Factor</TableCell>
            <TableCell align="right">Emissions (kgCO₂e)</TableCell>
            <TableCell>Scope</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r, i) => (
            <TableRow key={i}>
              <TableCell>{r.date}</TableCell>
              <TableCell>{r.source_category}</TableCell>
              <TableCell>{r.activity}</TableCell>
              <TableCell align="right">{r.amount}</TableCell>
              <TableCell>{r.unit}</TableCell>
              <TableCell align="right">{r.emission_factor}</TableCell>
              <TableCell align="right">{r.emissions_kgCO2e}</TableCell>
              <TableCell>{r.scope}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  )
}