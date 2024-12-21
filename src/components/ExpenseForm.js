import React, { useState } from 'react';
import { FaSync } from 'react-icons/fa';

function ExpenseForm({ onSubmit }) {
  const [item, setItem] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState('monthly');
  const [endDate, setEndDate] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (item && amount && date) {
      const expenseData = {
        item,
        amount: parseFloat(amount),
        date,
        isRecurring,
        ...(isRecurring && {
          frequency,
          endDate: endDate || null,
          nextDueDate: date // Initial next due date is the start date
        })
      };
      onSubmit(expenseData);
      setItem('');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setIsRecurring(false);
      setFrequency('monthly');
      setEndDate('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="expense-form">
      <div className="form-group">
        <label htmlFor="item">Item Name</label>
        <input
          type="text"
          id="item"
          value={item}
          onChange={(e) => setItem(e.target.value)}
          placeholder="Enter item name"
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="amount">Amount (Rs)</label>
        <input
          type="number"
          id="amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
          required
          min="0"
          step="0.01"
        />
      </div>
      <div className="form-group">
        <label htmlFor="date">Date</label>
        <input
          type="date"
          id="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>
      
      <div className="form-group recurring-toggle">
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
          />
          <span className="toggle-text">
            <FaSync className="recurring-icon" /> Recurring Expense
          </span>
        </label>
      </div>

      {isRecurring && (
        <>
          <div className="form-group">
            <label htmlFor="frequency">Frequency</label>
            <select
              id="frequency"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              required={isRecurring}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="endDate">End Date (Optional)</label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={date}
            />
          </div>
        </>
      )}

      <button type="submit" className="add-expense-btn">
        Add Expense
      </button>
    </form>
  );
}

export default ExpenseForm;
