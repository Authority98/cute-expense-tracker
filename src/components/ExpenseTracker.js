import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import { FaCalendarAlt, FaChevronDown, FaChevronLeft, FaChevronRight, FaSync } from 'react-icons/fa';
import { toast } from 'react-toastify';

const currencies = [
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'INR', symbol: '₹' },
  { code: 'PKR', symbol: 'Rs' },
  { code: 'AUD', symbol: 'A$' },
  { code: 'CAD', symbol: 'C$' },
  { code: 'JPY', symbol: '¥' },
];

function ExpenseTracker({ onAddExpense, isUserLoggedIn, currency }) {
  const [item, setItem] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState('monthly');
  const [endDate, setEndDate] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (item && amount && date) {
      console.log("Submitting expense:", { item, amount, date, isRecurring, frequency, endDate });
      onAddExpense({ 
        item, 
        amount: parseFloat(amount), 
        date: date.toISOString(),
        isRecurring,
        ...(isRecurring && {
          frequency,
          endDate: endDate ? endDate.toISOString() : null
        })
      });
      setItem('');
      setAmount('');
      setDate(new Date());
      setIsRecurring(false);
      setFrequency('monthly');
      setEndDate(null);
    } else {
      toast.error('Please fill in all fields');
    }
  };

  return (
    <div className="expense-tracker">
      <h2>
        Expense Tracker
        <select 
          className="currency-selector"
          value={currency.code}
          onChange={(e) => {
            const selectedCurrency = currencies.find(c => c.code === e.target.value);
            localStorage.setItem('currency', JSON.stringify(selectedCurrency));
            window.location.reload();
          }}
        >
          {currencies.map(c => (
            <option key={c.code} value={c.code}>
              {c.symbol} {c.code}
            </option>
          ))}
        </select>
      </h2>
      <form onSubmit={handleSubmit} className="expense-form">
        <div className="input-group">
          <input
            type="text"
            value={item}
            onChange={(e) => setItem(e.target.value)}
            placeholder="Item name"
            required
          />
          <div className="amount-input-group">
            <span className="currency-symbol">{currency.symbol}</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
              required
            />
          </div>
        </div>
        <div className="date-picker-wrapper">
          <DatePicker
            selected={date}
            onChange={(date) => setDate(date)}
            dateFormat="MMMM d, yyyy"
            className="date-picker-input"
            calendarClassName="custom-calendar"
            showPopperArrow={false}
            customInput={
              <div className="custom-input">
                <FaCalendarAlt className="calendar-icon" />
                <input value={format(date, 'MMMM d, yyyy')} readOnly />
                <FaChevronDown className="chevron-icon" />
              </div>
            }
            renderCustomHeader={({
              date,
              decreaseMonth,
              increaseMonth,
              prevMonthButtonDisabled,
              nextMonthButtonDisabled,
            }) => (
              <div className="custom-header">
                <FaChevronLeft
                  className="month-nav-icon"
                  onClick={decreaseMonth}
                  style={{ opacity: prevMonthButtonDisabled ? 0.5 : 1, cursor: prevMonthButtonDisabled ? 'default' : 'pointer' }}
                />
                <span>{format(date, 'MMMM yyyy')}</span>
                <FaChevronRight
                  className="month-nav-icon"
                  onClick={increaseMonth}
                  style={{ opacity: nextMonthButtonDisabled ? 0.5 : 1, cursor: nextMonthButtonDisabled ? 'default' : 'pointer' }}
                />
              </div>
            )}
          />
        </div>
        <div className="recurring-toggle">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
            />
            <span className="toggle-text">
              <FaSync className="recurring-icon" />
              Recurring Expense
            </span>
          </label>
        </div>
        {isRecurring && (
          <>
            <div className="form-group">
              <label>Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div className="form-group">
              <label>End Date (Optional)</label>
              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                dateFormat="MMMM d, yyyy"
                minDate={new Date()}
                isClearable
                placeholderText="Never"
                className="date-picker-input"
                calendarClassName="custom-calendar"
                customInput={
                  <div className="custom-input">
                    <FaCalendarAlt className="calendar-icon" />
                    <input 
                      value={endDate ? format(endDate, 'MMMM d, yyyy') : 'Never'} 
                      readOnly 
                      placeholder="Never"
                    />
                    <FaChevronDown className="chevron-icon" />
                  </div>
                }
              />
            </div>
          </>
        )}
        <button type="submit" className="add-expense-btn">
          Add Expense
        </button>
      </form>
    </div>
  );
}

export default ExpenseTracker;
