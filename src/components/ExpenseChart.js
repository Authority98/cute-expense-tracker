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

function ExpenseChart({ expenses, onDeleteExpense, isUserLoggedIn, isLoadingExpenses, currency }) {
  const [selectedRange, setSelectedRange] = useState('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [availableRanges, setAvailableRanges] = useState(['day', 'week', 'month', 'year']);

  useEffect(() => {
    let startDate, endDate;
    const now = new Date();

    switch (selectedRange) {
      case 'day':
        startDate = startOfDay(now);
        endDate = endOfDay(now);
        break;
      case 'week':
        startDate = startOfWeek(now, { weekStartsOn: 1 }); // Start week on Monday
        endDate = endOfWeek(now, { weekStartsOn: 1 });
        break;
      case 'month':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'year':
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        break;
      default:
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
    }

    const filtered = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return isWithinInterval(expenseDate, { start: startDate, end: endDate });
    });

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

    // Sort by amount in descending order
    const sorted = combined.sort((a, b) => b.amount - a.amount);
    setFilteredExpenses(sorted);
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
            return `${label}: ${currency.symbol} ${value.toFixed(2)} (${percentage}%)`;
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

  const getNoDataMessage = () => {
    const now = new Date();
    switch (selectedRange) {
      case 'day':
        return `No expenses found for ${format(now, 'MMMM d, yyyy')}`;
      case 'week':
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
        return `No expenses found for ${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
      case 'month':
        return `No expenses found for ${format(now, 'MMMM yyyy')}`;
      case 'year':
        return `No expenses found for ${format(now, 'yyyy')}`;
      default:
        return 'No expenses found for this period';
    }
  };

  const NoDataEmoji = () => (
    <div className="no-data-emoji">
      <picture>
        <source srcSet="https://fonts.gstatic.com/s/e/notoemoji/latest/1f914/512.webp" type="image/webp" />
        <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f914/512.gif" alt="🤔" width="96" height="96" />
      </picture>
      <p>{getNoDataMessage()}</p>
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

  const getRangeText = () => {
    const now = new Date();
    switch (selectedRange) {
      case 'day':
        return format(now, 'MMMM d, yyyy');
      case 'week':
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
      case 'month':
        return format(now, 'MMMM yyyy');
      case 'year':
        return format(now, 'yyyy');
      default:
        return 'All items';
    }
  };

  return (
    <div className="expense-chart">
      <div className="chart-header">
        <h2>Stats</h2>
        <span>{getRangeText()}</span>
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
        {filteredExpenses.length > 0 ? (
          <>
            <div className="chart-container">
              <Doughnut data={chartData} options={options} plugins={[animateColors]} />
            </div>
            <div className="expense-list">
              {filteredExpenses.map((expense, index) => (
                <div key={expense.id || index} className="expense-item">
                  <span className="item-name">{expense.item}</span>
                  <div className="amount-percentage">
                    <span className="item-amount">{currency.symbol} {expense.amount.toFixed(2)}</span>
                    <span 
                      className="item-percentage"
                      style={{ backgroundColor: getPercentageColor((expense.amount / totalExpense) * 100) }}
                    >
                      {((expense.amount / totalExpense) * 100).toFixed(0)}%
                    </span>
                  </div>
                  {expense.id && (
                    <button 
                      className="delete-btn"
                      onClick={() => handleDeleteExpense(expense.id)}
                      title="Delete expense"
                    >
                      ×
                    </button>
                  )}
                  <div 
                    className="item-bar" 
                    style={{ 
                      width: `${(expense.amount / totalExpense) * 100}%`,
                      background: `linear-gradient(to right, ${cuteGradientColors[index % cuteGradientColors.length].join(', ')})`
                    }}
                  />
                </div>
              ))}
            </div>
          </>
        ) : (
          <NoDataEmoji />
        )}
      </>
    </div>
  );
}

export default ExpenseChart;
