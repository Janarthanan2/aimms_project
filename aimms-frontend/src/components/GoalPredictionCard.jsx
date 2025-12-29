import React, { useEffect, useState } from 'react'
import API from '../api'

export default function GoalPredictionCard({ goalId, userId }) {
    const [prediction, setPrediction] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        fetchPrediction()
    }, [goalId])

    const fetchPrediction = async () => {
        try {
            setLoading(true)
            const res = await API.get(`/goals/${goalId}/prediction?userId=${userId}`)
            setPrediction(res.data)
            setError(null)
        } catch (err) {
            console.error(err)
            setError("Unable to generate prediction.")
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="text-white/60 text-sm animate-pulse">Analyzing spending habits...</div>

    if (error) return (
        <div className="bg-red-500/10 border border-red-500/30 rounded p-3 text-red-200 text-sm mt-4">
            {error}
        </div>
    )

    if (!prediction) return null

    const { predicted_completion_date, daily_savings_estimate, required_daily_savings, on_track, suggested_daily_cut } = prediction

    return (
        <div className={`mt-4 rounded-xl p-4 border backdrop-blur-md ${on_track ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'
            }`}>
            <h4 className={`text-sm font-semibold uppercase tracking-wider mb-2 ${on_track ? 'text-emerald-300' : 'text-rose-300'}`}>
                {on_track ? '🎉 On Track' : '⚠️ Behind Schedule'}
            </h4>

            <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-white/70">Estimated Completion</span>
                    <span className="font-mono text-white font-medium">{predicted_completion_date}</span>
                </div>

                <div className="flex justify-between items-center text-sm">
                    <span className="text-white/70">Required Daily Savings</span>
                    <span className="font-mono text-emerald-300 font-medium">₹{required_daily_savings?.toFixed(2)}</span>
                </div>

                {!on_track && suggested_daily_cut > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                        <p className="text-xs text-white/50 mb-1">Recommendation:</p>
                        <p className="text-sm text-rose-200">
                            Reduce daily spending by <span className="font-bold">₹{suggested_daily_cut?.toFixed(2)}</span> to meet your deadline.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
