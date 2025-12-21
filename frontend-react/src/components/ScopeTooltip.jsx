import React from 'react'

const ScopeTooltip = () => {
    return (
        <div className="group relative inline-block ml-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400 cursor-help hover:text-green-600 transition-colors">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            <div className="invisible group-hover:visible absolute z-50 w-64 p-3 mt-2 text-sm text-white bg-gray-800 rounded-lg shadow-lg -left-28 top-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="font-semibold mb-1">Emission Scopes:</div>
                <ul className="list-disc pl-4 space-y-1 text-xs">
                    <li><span className="font-bold text-green-400">Scope 1:</span> Direct emissions (e.g., fuel combustion, company vehicles).</li>
                    <li><span className="font-bold text-blue-400">Scope 2:</span> Indirect emissions from purchased electricity.</li>
                    <li><span className="font-bold text-yellow-400">Scope 3:</span> Other indirect emissions (e.g., supply chain, waste, travel).</li>
                </ul>
                <div className="absolute w-3 h-3 bg-gray-800 transform rotate-45 -top-1.5 left-1/2 -translate-x-1/2"></div>
            </div>
        </div>
    )
}

export default ScopeTooltip
