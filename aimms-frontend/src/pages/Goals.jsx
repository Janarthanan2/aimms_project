import React, { useEffect, useState } from 'react'
import API from '../api'
import GoalPredictionCard from '../components/GoalPredictionCard'

export default function Goals() {
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const userId = localStorage.getItem('userId')

  useEffect(() => {
    if (userId) {
      fetchGoals()
    }
  }, [userId])

  const fetchGoals = async () => {
    try {
      const res = await API.get(`/goals/user/${userId}`)
      setGoals(res.data || [])
    } catch (err) {
      console.error("Failed to load goals", err)
    } finally {
      setLoading(false)
    }
  }


  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    goalName: '',
    targetAmount: '',
    currentAmount: '0',
    deadline: ''
  })
  const [submitting, setSubmitting] = useState(false)

  const openCreateModal = () => {
    setEditingId(null)
    setFormData({ goalName: '', targetAmount: '', currentAmount: '0', deadline: '' })
    setShowModal(true)
  }

  const openEditModal = (goal) => {
    setEditingId(goal.goalId)
    setFormData({
      goalName: goal.goalName,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      deadline: goal.deadline
    })
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      const payload = {
        ...formData,
        targetAmount: parseFloat(formData.targetAmount),
        currentAmount: parseFloat(formData.currentAmount)
      }

      if (editingId) {
        await API.put(`/goals/${editingId}`, payload)
      } else {
        await API.post(`/goals/user/${userId}`, payload)
      }

      setShowModal(false)
      fetchGoals()
    } catch (err) {
      console.error("Failed to save goal", err)
      alert("Failed to save goal")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this goal?")) return
    try {
      await API.delete(`/goals/${id}`)
      fetchGoals()
    } catch (err) {
      console.error("Failed to delete goal", err)
    }
  }

  if (!userId) return <div className="p-10 text-center text-white">Please log in to view goals.</div>

  return (
    <div className="p-6 space-y-8 animate-fade-in relative">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-display font-bold gradient-text">Your Goals</h2>
          <p className="text-yellow-50/80 mt-1 font-medium">Track your progress and stay on budget</p>
        </div>
        <button
          onClick={openCreateModal}
          className="btn-vibrant-outline text-sm py-2 px-4 rounded-full"
        >
          + New Goal
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 rounded-2xl bg-white/5 animate-pulse"></div>
          ))}
        </div>
      ) : goals.length === 0 ? (
        <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
          <p className="text-white/80">No goals set yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map(goal => (
            <GoalCard
              key={goal.goalId}
              goal={goal}
              userId={userId}
              onEdit={() => openEditModal(goal)}
              onDelete={() => handleDelete(goal.goalId)}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="card-vibrant w-full max-w-md animate-scale-in relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-white"
            >
              ✕
            </button>
            <h3 className="text-xl font-bold text-white mb-6">{editingId ? 'Edit Goal' : 'Create New Goal'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm text-lime-100 mb-1">Goal Name</label>
                <input
                  required
                  className="input-vibrant w-full"
                  value={formData.goalName}
                  onChange={e => setFormData({ ...formData, goalName: e.target.value })}
                  placeholder="e.g. New Laptop"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-lime-100 mb-1">Target Amount (₹)</label>
                  <input
                    required
                    type="number"
                    className="input-vibrant w-full"
                    value={formData.targetAmount}
                    onChange={e => setFormData({ ...formData, targetAmount: e.target.value })}
                    placeholder="50000"
                  />
                </div>
                <div>
                  <label className="block text-sm text-lime-100 mb-1">Current Saved (₹)</label>
                  <input
                    type="number"
                    className="input-vibrant w-full"
                    value={formData.currentAmount}
                    onChange={e => setFormData({ ...formData, currentAmount: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-lime-100 mb-1">Deadline</label>
                <input
                  required
                  type="date"
                  className="input-vibrant w-full"
                  value={formData.deadline}
                  onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-white/70 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-vibrant px-6 py-2"
                >
                  {submitting ? 'Saving...' : (editingId ? 'Update Goal' : 'Create Goal')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function GoalCard({ goal, userId, onEdit, onDelete }) {
  const percent = Math.min(100, Math.max(0, (goal.currentAmount / goal.targetAmount) * 100))

  return (
    <div className="card-vibrant group hover:translate-y-[-4px] transition-all duration-300 relative">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-xl text-white group-hover:text-lime-300 transition-colors">{goal.goalName}</h3>
          <p className="text-xs text-white/80 font-medium">{goal.deadline ? `Deadline: ${goal.deadline}` : 'No Deadline'}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onEdit} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-blue-200 transition-colors" title="Edit">
            ✏️
          </button>
          <button onClick={onDelete} className="p-2 bg-white/10 hover:bg-red-500/20 rounded-lg text-red-200 transition-colors" title="Delete">
            🗑️
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2 text-white/90 font-bold">
          <span>₹{goal.currentAmount?.toLocaleString()}</span>
          <span>₹{goal.targetAmount?.toLocaleString()}</span>
        </div>
        <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent-400 to-secondary-400 transition-all duration-1000 ease-out"
            style={{ width: `${percent}%` }}
          ></div>
        </div>
      </div>

      {/* Prediction Section */}
      <GoalPredictionCard goalId={goal.goalId} userId={userId} />
    </div>
  )
}
