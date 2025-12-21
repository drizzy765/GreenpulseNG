import { useEffect, useState } from 'react'
import { dataService } from '../api/dataService'
import { Box, Typography, Card, CardContent, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material'

const rankBadge = (rank) => {
  if (rank === 1) return 'Gold Leaf'
  if (rank === 2) return 'Silver Leaf'
  if (rank === 3) return 'Bronze Leaf'
  return 'Green Participant'
}

export default function Leaderboard() {
  const [rows, setRows] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const response = await dataService.getLeaderboard()
        // Handle both direct response and response.data formats
        const data = response?.data || response
        const leaderboard = data?.leaderboard || data || []
        // Data is already sorted by green_score from backend, but ensure descending order
        const sorted = Array.isArray(leaderboard)
          ? leaderboard.sort((a, b) => (b.green_score || 0) - (a.green_score || 0))
          : []
        setRows(sorted.map((r, i) => ({
          rank: i + 1,
          name: r.business_name || r.business_id || 'Unknown',
          type: r.business_type || 'Unknown',
          score: Math.round(r.green_score || 0),
          updated: r.updated_at ? r.updated_at.slice(0, 10) : new Date().toISOString().slice(0, 10)
        })))
      } catch (err) {
        setError(err.response?.data?.detail || err.message || 'Failed to load leaderboard')
      }
    }
    load()
  }, [])

  return (
    <Box className="px-4 py-4" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h5" gutterBottom>Leaderboard</Typography>
      {error && <Typography color="error">{error}</Typography>}
      <Card className="bg-white shadow-sm rounded-md">
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Rank</TableCell>
                <TableCell>Business Name</TableCell>
                <TableCell>Business Type</TableCell>
                <TableCell>Green Score</TableCell>
                <TableCell>Ranking Badge</TableCell>
                <TableCell>Last Updated</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={i}>
                  <TableCell>{r.rank}</TableCell>
                  <TableCell>{r.name}</TableCell>
                  <TableCell>{r.type}</TableCell>
                  <TableCell>{r.score}</TableCell>
                  <TableCell>{rankBadge(r.rank)}</TableCell>
                  <TableCell>{r.updated}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  )
}