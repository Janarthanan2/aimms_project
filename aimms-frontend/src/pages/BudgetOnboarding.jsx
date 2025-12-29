import React, { useState, useEffect } from 'react'
import API from '../api'

export default function BudgetOnboarding({ userId, onComplete }) {
    const [step, setStep] = useState(1)
    const [income, setIncome] = useState('')
    const [fixedExpenses, setFixedExpenses] = useState([{ name: 'Rent', amount: '' }])
    const [categoryLimits, setCategoryLimits] = useState([])
    const [savings, setSavings] = useState('')
    const [alerts, setAlerts] = useState(['80', '100'])
    const [loadingCategories, setLoadingCategories] = useState(true)

    useEffect(() => {
        API.get('/categories')
            .then(res => {
                const cats = res.data || []
                // Filter out Salary/Income and map to initial state
                const allowed = [
                    "Bills", "Health", "Miscellaneous", "Food & Drink", "Shopping",
                    "Groceries", "Transport", "Entertainment", "Subscriptions", "Rent", "Utilities"
                ];
                const initial = cats
                    .filter(c => allowed.includes(c.name))
                    .map(c => ({
                        name: c.name,
                        // Keep some default values for demo purposes if they match
                        amount: c.name === 'Food & Drink' ? 3000 :
                            c.name === 'Transport' ? 1500 :
                                c.name === 'Rent' ? 10000 : 0
                    }))
                setCategoryLimits(initial)
            })
            .catch(err => console.error("Failed to fetch categories", err))
            .finally(() => setLoadingCategories(false))
    }, [])
    const [submitting, setSubmitting] = useState(false)

    // Derived values
    const totalFixed = fixedExpenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
    const disposableIncome = (parseFloat(income) || 0) - totalFixed
    const totalAllocated = categoryLimits.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
    const savingsAmount = parseFloat(savings) || 0
    const remaining = disposableIncome - totalAllocated - savingsAmount

    const handleSubmit = async () => {
        try {
            setSubmitting(true)
            const payload = {
                monthlyIncome: parseFloat(income),
                savingsTarget: parseFloat(savings),
                fixedExpenses: fixedExpenses.reduce((acc, item) => ({ ...acc, [item.name]: parseFloat(item.amount) }), {}),
                categoryLimits: categoryLimits.reduce((acc, item) => ({ ...acc, [item.name]: parseFloat(item.amount) }), {}),
                alertThresholds: alerts
            }
            await API.post(`/budgets/onboarding/${userId}`, payload)
            if (onComplete) onComplete()
            else window.location.reload()
        } catch (err) {
            console.error(err)
            alert("Failed to save budget plan.")
        } finally {
            setSubmitting(false)
        }
    }

    const nextStep = () => setStep(s => s + 1)
    const prevStep = () => setStep(s => s - 1)

    return (
        <div className="max-w-2xl mx-auto p-8 animate-fade-in text-white">
            <h1 className="text-3xl font-display font-bold gradient-text mb-2">Plan Your Month</h1>
            <div className="flex gap-2 mb-8">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full ${step >= i ? 'bg-accent-400' : 'bg-white/10'}`}></div>
                ))}
            </div>

            {step === 1 && (
                <div className="card-vibrant animate-scale-in">
                    <h2 className="text-xl font-bold mb-4">Step 1: Total Monthly Income (The Pot)</h2>
                    <p className="text-white/60 mb-6">Enter your total expected take-home income for the month.</p>
                    <input
                        type="number"
                        className="input-vibrant text-2xl w-full mb-6"
                        placeholder="₹ 0"
                        value={income}
                        onChange={e => setIncome(e.target.value)}
                        autoFocus
                    />
                    <button
                        disabled={!income}
                        onClick={nextStep}
                        className="btn-vibrant w-full"
                    >
                        Next: Fixed Expenses
                    </button>
                </div>
            )}

            {step === 2 && (
                <div className="card-vibrant animate-scale-in">
                    <h2 className="text-xl font-bold mb-4">Step 2: Fixed Expenses</h2>
                    <p className="text-white/60 mb-6">Enter essential fixed costs (Rent, EMI, etc.). These are deducted first.</p>

                    <div className="space-y-3 mb-6">
                        {fixedExpenses.map((ex, idx) => (
                            <div key={idx} className="flex gap-2">
                                <input
                                    className="input-vibrant flex-1 text-sm"
                                    placeholder="Expense Name"
                                    value={ex.name}
                                    onChange={e => {
                                        const newEx = [...fixedExpenses]
                                        newEx[idx].name = e.target.value
                                        setFixedExpenses(newEx)
                                    }}
                                />
                                <input
                                    type="number"
                                    className="input-vibrant w-32 text-sm"
                                    placeholder="Amount"
                                    value={ex.amount}
                                    onChange={e => {
                                        const newEx = [...fixedExpenses]
                                        newEx[idx].amount = e.target.value
                                        setFixedExpenses(newEx)
                                    }}
                                />
                                <button
                                    onClick={() => setFixedExpenses(fixedExpenses.filter((_, i) => i !== idx))}
                                    className="text-white/40 hover:text-red-400 px-2"
                                >✕</button>
                            </div>
                        ))}
                        <button
                            onClick={() => setFixedExpenses([...fixedExpenses, { name: '', amount: '' }])}
                            className="text-sm text-accent-300 hover:text-accent-200"
                        >
                            + Add Expense
                        </button>
                    </div>

                    <div className="bg-white/5 p-4 rounded-lg mb-6">
                        <div className="flex justify-between text-sm">
                            <span>Total Income</span>
                            <span>₹{parseFloat(income || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm text-rose-300 mt-1">
                            <span>- Fixed Expenses</span>
                            <span>₹{totalFixed.toLocaleString()}</span>
                        </div>
                        <div className="border-t border-white/10 my-2"></div>
                        <div className="flex justify-between font-bold text-emerald-300">
                            <span>Disposable Income</span>
                            <span>₹{disposableIncome.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={prevStep} className="px-4 py-2 text-white/60">Back</button>
                        <button onClick={nextStep} className="btn-vibrant flex-1">Next: Categories</button>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="card-vibrant animate-scale-in">
                    <h2 className="text-xl font-bold mb-2">Step 3: Category Budgets</h2>
                    <p className="text-white/60 mb-6">Set spending limits for your daily habits.</p>

                    <div className="mb-4 text-center">
                        <span className="text-xs uppercase text-white/50">Available for Allocation</span>
                        <div className={`text-2xl font-mono font-bold ${remaining < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                            ₹{remaining.toLocaleString()}
                        </div>
                    </div>

                    <div className="space-y-6 mb-6 max-h-[40vh] overflow-y-auto pr-2">
                        {loadingCategories ? (
                            <div className="text-center text-white/50 py-4">Loading categories...</div>
                        ) : categoryLimits.map((cat, idx) => (
                            <div key={idx}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>{cat.name}</span>
                                    <span className="font-mono">₹{cat.amount}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max={disposableIncome}
                                    step="500"
                                    value={cat.amount}
                                    onChange={e => {
                                        const newCats = [...categoryLimits]
                                        newCats[idx].amount = parseFloat(e.target.value)
                                        setCategoryLimits(newCats)
                                    }}
                                    className="w-full accent-accent-400 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-3">
                        <button onClick={prevStep} className="px-4 py-2 text-white/60">Back</button>
                        <button disabled={remaining < 0} onClick={nextStep} className="btn-vibrant flex-1">Next: Savings</button>
                    </div>
                </div>
            )}

            {step === 4 && (
                <div className="card-vibrant animate-scale-in">
                    <h2 className="text-xl font-bold mb-4">Step 4: Savings First</h2>
                    <p className="text-white/60 mb-6">Pay yourself. How much do you want to save?</p>

                    <div className="mb-6">
                        <label className="block text-sm mb-2 text-white/70">Savings Goal for this Month</label>
                        <input
                            type="number"
                            className="input-vibrant w-full text-xl"
                            value={savings}
                            onChange={e => setSavings(e.target.value)}
                            placeholder="₹ 5000"
                        />
                        <div className="mt-2 flex justify-between text-xs text-white/40">
                            <span>Remaining Budget: ₹{remaining.toLocaleString()}</span>
                            {remaining < 0 && <span className="text-red-400">Budget Exceeded!</span>}
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={prevStep} className="px-4 py-2 text-white/60">Back</button>
                        <button disabled={remaining < 0} onClick={nextStep} className="btn-vibrant flex-1">Next: Alerts</button>
                    </div>
                </div>
            )}

            {step === 5 && (
                <div className="card-vibrant animate-scale-in">
                    <h2 className="text-xl font-bold mb-4">Step 5: Smart Alerts</h2>
                    <p className="text-white/60 mb-6">When should I notify you about overspending?</p>

                    <div className="space-y-4 mb-8">
                        {['50', '80', '100'].map(val => (
                            <label key={val} className="flex items-center gap-3 p-4 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={alerts.includes(val)}
                                    onChange={e => {
                                        if (e.target.checked) setAlerts([...alerts, val])
                                        else setAlerts(alerts.filter(a => a !== val))
                                    }}
                                    className="w-5 h-5 accent-accent-400"
                                />
                                <div>
                                    <div className="font-bold">At {val}% of budget</div>
                                    <div className="text-xs text-white/50">
                                        {val === '100' ? 'Get notified immediately when you exceed a limit.' : `Get a heads up when you hit ${val}% of your limit.`}
                                    </div>
                                </div>
                            </label>
                        ))}
                    </div>

                    <div className="flex gap-3">
                        <button onClick={prevStep} className="px-4 py-2 text-white/60">Back</button>
                        <button
                            disabled={submitting}
                            onClick={handleSubmit}
                            className="btn-vibrant flex-1"
                        >
                            {submitting ? 'Saving Plan...' : 'Finish & Save Budget'}
                        </button>
                    </div>
                </div>
            )}

        </div>
    )
}
