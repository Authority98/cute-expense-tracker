import React, { useState, useEffect, useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { format, startOfDay, startOfWeek, startOfMonth, startOfYear, endOfDay, endOfWeek, endOfMonth, endOfYear, isWithinInterval } from 'date-fns';
import { toast } from 'react-toastify';

ChartJS.register(ArcElement, Tooltip, Legend);

const cuteGradientColors = [
  ['#a855f7', '#ec4899'],
  ['#3b82f6', '#14b8a6'],
  ['#f43f5e', '#f97316'],
  ['#8b5cf6', '#6366f1'],
  ['#10b981', '#14b8a6'],
];

const getPercentageColor = (percentage) => {
  const hue = ((100 - percentage) * 120 / 100).toFixed(0);
  return `hsl(${hue}, 80%, 80%)`;
};

const animateColors = {
  id: 'animateColors',
  beforeDraw: (chart) => {
    const ctx = chart.ctx;
    const chartArea = chart.chartArea;
    const centerX = (chartArea.left + chartArea.right) / 2;
    const centerY = (chartArea.top + chartArea.bottom) / 2;
    const radius = Math.min(chartArea.right - chartArea.left, chartArea.bottom - chartArea.top) / 2;

    chart.data.datasets[0].data.forEach((value, index) => {
      const startAngle = chart._metasets[0].data[index].startAngle;
      const endAngle = chart._metasets[0].data[index].endAngle;
      
      // Create a linear gradient
      const gradient = ctx.createLinearGradient(
        centerX + Math.cos(startAngle) * radius,
        centerY + Math.sin(startAngle) * radius,
        centerX + Math.cos(endAngle) * radius,
        centerY + Math.sin(endAngle) * radius
      );
      
      const colors = cuteGradientColors[index % cuteGradientColors.length];
      gradient.addColorStop(0, colors[0]);
      gradient.addColorStop(1, colors[1]);
      
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.restore();
    });
  }
};

function ExpenseChart({ expenses, onDeleteExpense, isUserLoggedIn, isLoadingExpenses }) {
  const [selectedRange, setSelectedRange] = useState('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [availableRanges, setAvailableRanges] = useState([]);
  const [isDataReady, setIsDataReady] = useState(false);

  useEffect(() => {
    const now = new Date();
    const ranges = {
      day: { start: startOfDay(now), end: endOfDay(now) },
      week: { start: startOfWeek(now), end: endOfWeek(now) },
      month: { start: startOfMonth(now), end: endOfMonth(now) },
      year: { start: startOfYear(now), end: endOfYear(now) },
    };

    const availableRanges = Object.entries(ranges).filter(([_, range]) => 
      expenses.some(expense => {
        const expenseDate = new Date(expense.date);
        return isWithinInterval(expenseDate, range);
      })
    ).map(([key]) => key);

    setAvailableRanges(availableRanges);

    if (!availableRanges.includes(selectedRange)) {
      setSelectedRange(availableRanges[0] || 'day');
    }
  }, [expenses, selectedRange]);

  useEffect(() => {
    let startDate, endDate;
    const now = new Date();

    switch (selectedRange) {
      case 'day':
        startDate = startOfDay(now);
        endDate = endOfDay(now);
        break;
      case 'week':
        startDate = startOfWeek(now);
        endDate = endOfWeek(now);
        break;
      case 'month':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'year':
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        break;
      case 'custom':
        startDate = startOfDay(selectedDate);
        endDate = endOfDay(selectedDate);
        break;
      default:
        startDate = startOfDay(now);
        endDate = endOfDay(now);
    }

    const filtered = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return isWithinInterval(expenseDate, { start: startDate, end: endDate });
    });

    console.log("Filtered expenses:", filtered);

    // Combine duplicate expenses
    const combined = filtered.reduce((acc, expense) => {
      const existingExpense = acc.find(e => e.item === expense.item);
      if (existingExpense) {
        existingExpense.amount += expense.amount;
      } else {
        acc.push({ ...expense });
      }
      return acc;
    }, []);

    setFilteredExpenses(combined);
  }, [expenses, selectedRange, selectedDate]);

  const totalExpense = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  const chartData = useMemo(() => {
    const data = filteredExpenses.map(expense => expense.amount);
    const labels = filteredExpenses.map(expense => expense.item);
    const backgroundColors = filteredExpenses.map((_, index) => cuteGradientColors[index % cuteGradientColors.length][0]);

    return {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: backgroundColors,
        borderWidth: 0
      }]
    };
  }, [filteredExpenses]);

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#333',
        bodyColor: '#666',
        bodyFont: {
          size: 14
        },
        borderColor: '#ccc',
        borderWidth: 1,
        caretSize: 10,
        cornerRadius: 15,
        padding: 15,
        boxPadding: 5,
        usePointStyle: true,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const percentage = ((value / totalExpense) * 100).toFixed(0);
            return `${label}: ${value} (${percentage}%)`;
          },
          labelTextColor: function(context) {
            return '#666';
          },
          title: function(context) {
            return '💰 Expense Details 💰';
          }
        }
      }
    }
  };

  const NoDataEmoji = () => (
    <div className="no-data-emoji">
      <picture>
        <source srcSet="https://fonts.gstatic.com/s/e/notoemoji/latest/1f914/512.webp" type="image/webp" />
        <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f914/512.gif" alt="🤔" width="96" height="96" />
      </picture>
      <p>No expenses found for this period</p>
    </div>
  );

  const LoadingIndicator = () => (
    <div className="loading-indicator">
      <picture>
        <source srcset="https://fonts.gstatic.com/s/e/notoemoji/latest/1f680/512.webp" type="image/webp" />
        <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f680/512.gif" alt="🚀" width="96" height="96" />
      </picture>
      <p>Loading expenses...</p>
    </div>
  );

  const handleDeleteExpense = (id) => {
    if (isUserLoggedIn) {
      onDeleteExpense(id);
    } else {
      toast.error('Please sign in to delete expenses.');
    }
  };

  if (isLoadingExpenses) {
    return (
      <div className="expense-chart">
        <div className="chart-header">
          <h2>Stats</h2>
          <span>All items</span>
        </div>
        <LoadingIndicator />
      </div>
    );
  }

  return (
    <div className="expense-chart">
      <div className="chart-header">
        <h2>Stats</h2>
        <span>All items</span>
      </div>
      <>
        <div className="time-range-selector-container">
          <div className="time-range-selector">
            <button 
              className={selectedRange === 'day' ? 'active' : ''} 
              onClick={() => setSelectedRange('day')}
            >
              Day
            </button>
            <button 
              className={selectedRange === 'week' ? 'active' : ''} 
              onClick={() => setSelectedRange('week')}
            >
              Week
            </button>
            <button 
              className={selectedRange === 'month' ? 'active' : ''} 
              onClick={() => setSelectedRange('month')}
            >
              Month
            </button>
            <button 
              className={selectedRange === 'year' ? 'active' : ''} 
              onClick={() => setSelectedRange('year')}
            >
              Year
            </button>
          </div>
        </div>
        <div className="chart-container" style={{ position: 'relative', height: '300px', width: '100%' }}>
          {filteredExpenses.length > 0 ? (
            <Doughnut 
              data={chartData}
              options={{
                ...options,
                responsive: true,
                maintainAspectRatio: false,
              }}
            />
          ) : (
            <NoDataEmoji />
          )}
        </div>
        {filteredExpenses.length > 0 && (
          <div className="expense-list">
            <div className="expense-item total">
              <span className="item-name">Total</span>
              <span className="item-amount">₨ {totalExpense.toFixed(0)}</span>
            </div>
            {filteredExpenses.map((expense, index) => {
              const percentage = ((expense.amount / totalExpense) * 100).toFixed(0);
              return (
                <div key={index} className="expense-item">
                  <span className="item-name">{expense.item}</span>
                  <div className="amount-percentage">
                    <span className="item-amount">₨ {expense.amount.toFixed(0)}</span>
                    <span 
                      className="item-percentage" 
                      style={{background: `linear-gradient(to right, ${getPercentageColor(percentage)}, white)`}}
                    >
                      {percentage}%
                    </span>
                  </div>
                  <button className="delete-btn" onClick={() => handleDeleteExpense(expense.id)}>×</button>
                  <div className="item-bar" style={{ 
                    width: `${percentage}%`, 
                    background: getPercentageColor(percentage)
                  }}></div>
                </div>
              );
            })}
          </div>
        )}
      </>
    </div>
  );
}

export default ExpenseChart;
