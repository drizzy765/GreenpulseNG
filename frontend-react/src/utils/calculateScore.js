export const calculateEmission = (amount, factor) => {
    const a = Number(amount) || 0
    const f = Number(factor) || 0
    return Number((a * f).toFixed(4))
}
