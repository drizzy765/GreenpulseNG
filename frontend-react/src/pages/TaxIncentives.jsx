import { useEffect, useState } from 'react'
import { getTaxIncentives } from '../api/emissions'
import { Box, Typography, List, ListItem, ListItemText } from '@mui/material'

export default function TaxIncentives() {
  const [items, setItems] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    const run = async () => {
      try {
        const { data } = await getTaxIncentives()
        setItems(Array.isArray(data) ? data : (data.items || []))
      } catch (err) {
        setError(err.response?.data?.detail || err.message)
      }
    }
    run()
  }, [])

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Tax Incentives (Nigeria)</Typography>
      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
      <List>
        {items.map((item, i) => (
          <ListItem key={i}>
            <ListItemText primary={item.title || item} secondary={item.description} />
          </ListItem>
        ))}
      </List>
    </Box>
  )
}