import React, { useState } from 'react';
import { FaSync } from 'react-icons/fa';

function ExpenseList({ expenses, onEdit, onDelete }) {
  const [editId, setEditId] = useState(null);
  const [editItem, setEditItem] = useState('');
  const [editAmount, setEditAmount] = useState('');

  const handleEdit = (id) => {
    const expense = expenses.find(e => e.id === id);
    setEditId(id);
    setEditItem(expense.item);
    setEditAmount(expense.amount.toString());
  };

  const handleSave = () => {
    onEdit(editId, { item: editItem, amount: parseFloat(editAmount) });
    setEditId(null);
  };

  return (
    <div className="expense-list">
      <h2>Expenses</h2>
      {expenses.map(expense => (
        <div key={expense.id} className="expense-item" style={{ backgroundColor: expense.color }}>
          {editId === expense.id ? (
            <>
              <input
                type="text"
                value={editItem}
                onChange={(e) => setEditItem(e.target.value)}
              />
              <input
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
              />
              <button onClick={handleSave}>Save</button>
            </>
          ) : (
            <>
              <div className="expense-details">
                <span>{expense.item}</span>
                {expense.isRecurring && (
                  <span className="recurring-indicator">
                    <FaSync /> {expense.frequency}
                  </span>
                )}
              </div>
              <span>Rs {expense.amount.toFixed(2)}</span>
              <button onClick={() => handleEdit(expense.id)}>Edit</button>
              <button onClick={() => onDelete(expense.id)}>Delete</button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

export default ExpenseList;
