import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import { FaCalendarAlt, FaChevronDown, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { toast } from 'react-toastify';

function ExpenseTracker({ onAddExpense }) {
  const [item, setItem] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());

  const handleSubmit = (e) => {
    e.preventDefault();
    if (item && amount && date) {
      console.log("Submitting expense:", { item, amount, date });
      onAddExpense({ 
        item, 
        amount: parseFloat(amount), 
        date: date.toISOString()
      });
      setItem('');
      setAmount('');
      setDate(new Date());
    } else {
      toast.error('Please fill in all fields');
    }
  };

  return (
    <div className="expense-tracker">
      <h2>Expense Tracker</h2>
      <form onSubmit={handleSubmit} className="expense-form">
        <div className="input-group">
          <input
            type="text"
            value={item}
            onChange={(e) => setItem(e.target.value)}
            placeholder="Item name"
            required
          />
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            required
          />
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
        <button type="submit" className="add-expense-btn">
          Add Expense
        </button>
      </form>
    </div>
  );
}

export default ExpenseTracker;
