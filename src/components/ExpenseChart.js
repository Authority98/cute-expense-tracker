import React, { useState, useEffect, useMemo } from 'react';
import { PolarArea, Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Title
} from 'chart.js';
import {
  format,
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
  endOfDay,
  endOfWeek,
  endOfMonth,
  endOfYear,
  isWithinInterval,
  subMonths,
  eachDayOfInterval,
  eachMonthOfInterval,
  isSameDay,
  isSameMonth
} from 'date-fns';
import { toast } from 'react-toastify';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Title
);

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

// Helper functions for data preparation - moved outside component
const prepareTrendData = (range, now, expenses) => {
  let dates = [];
  let data = [];

  switch (range) {
    case 'day':
      // For day view, show hourly trend
      dates = Array.from({ length: 24 }, (_, i) => {
        const date = new Date(now);
        date.setHours(i, 0, 0, 0);
        return date;
      });
      data = dates.map(date => {
        const hourExpenses = expenses.filter(expense => {
          const expenseDate = new Date(expense.date);
          return expenseDate.getHours() === date.getHours() &&
                 isSameDay(expenseDate, date);
        });
        return hourExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      });
      break;

    case 'week':
      // For week view, show daily trend
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
      dates = eachDayOfInterval({ start: weekStart, end: weekEnd });
      data = dates.map(date => {
        const dayExpenses = expenses.filter(expense => 
          isSameDay(new Date(expense.date), date)
        );
        return dayExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      });
      break;

    case 'month':
      // For month view, show daily trend
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      dates = eachDayOfInterval({ start: monthStart, end: monthEnd });
      data = dates.map(date => {
        const dayExpenses = expenses.filter(expense => 
          isSameDay(new Date(expense.date), date)
        );
        return dayExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      });
      break;

    case 'year':
      // For year view, show monthly trend
      const yearStart = startOfYear(now);
      const yearEnd = endOfYear(now);
      dates = eachMonthOfInterval({ start: yearStart, end: yearEnd });
      data = dates.map(date => {
        const monthExpenses = expenses.filter(expense => 
          isSameMonth(new Date(expense.date), date)
        );
        return monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      });
      break;

    default:
      break;
  }

  return { dates, data };
};

const prepareComparisonData = (now, expenses) => {
  const months = Array.from({ length: 6 }, (_, i) => subMonths(now, i)).reverse();
  
  const data = months.map(month => {
    const monthExpenses = expenses.filter(expense => 
      isSameMonth(new Date(expense.date), month)
    );
    return monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  });

  return { months, data };
};

// Custom hooks for chart data
const useChartData = (filteredExpenses) => {
  return useMemo(() => {
    const data = filteredExpenses.map(expense => expense.amount);
    const labels = filteredExpenses.map(expense => expense.item);
    const total = data.reduce((sum, amount) => sum + amount, 0);
    
    // Create gradient colors with opacity variations
    const backgroundColors = filteredExpenses.map((_, index) => {
      const colors = cuteGradientColors[index % cuteGradientColors.length];
      const percentage = (data[index] / total) * 100;
      const opacity = Math.max(0.5, Math.min(0.9, percentage / 100)); // Slightly higher minimum opacity
      return `rgba(${hexToRgb(colors[0])}, ${opacity})`;
    });

    const borderColors = filteredExpenses.map((_, index) => {
      const colors = cuteGradientColors[index % cuteGradientColors.length];
      return colors[0];
    });

    return {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 2,
        hoverBorderWidth: 3,
        hoverBackgroundColor: backgroundColors.map(color => color.replace(/[\d.]+\)$/, '0.8)')),
      }]
    };
  }, [filteredExpenses]);
};

// Helper function to convert hex to rgb
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? 
    `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
    '0, 0, 0';
};

const useTrendData = (expenses, selectedRange) => {
  return useMemo(() => {
    const now = new Date();
    const emptyData = {
      labels: [],
      datasets: [{
        label: 'Expenses',
        data: [],
        borderColor: '#a855f7',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        tension: 0.4,
        fill: true
      }]
    };

    if (!expenses || expenses.length === 0 || !selectedRange) {
      return emptyData;
    }

    const { dates, data } = prepareTrendData(selectedRange, now, expenses);

    return {
      labels: dates.map(date => {
        switch (selectedRange) {
          case 'day':
            return format(date, 'HH:00');
          case 'week':
            return format(date, 'EEE');
          case 'month':
            return format(date, 'd');
          case 'year':
            return format(date, 'MMM');
          default:
            return '';
        }
      }),
      datasets: [{
        label: 'Expenses',
        data: data,
        borderColor: '#a855f7',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        tension: 0.4,
        fill: true
      }]
    };
  }, [expenses, selectedRange]);
};

const useComparisonData = (expenses) => {
  return useMemo(() => {
    const now = new Date();
    const emptyData = {
      labels: [],
      datasets: [{
        label: 'Monthly Expenses',
        data: [],
        backgroundColor: [],
        borderRadius: 8
      }]
    };

    if (!expenses || expenses.length === 0) {
      return emptyData;
    }

    const { months, data } = prepareComparisonData(now, expenses);

    return {
      labels: months.map(date => format(date, 'MMM yyyy')),
      datasets: [{
        label: 'Monthly Expenses',
        data: data,
        backgroundColor: months.map((_, index) => {
          const colors = cuteGradientColors[index % cuteGradientColors.length];
          return colors[0];
        }),
        borderRadius: 8
      }]
    };
  }, [expenses]);
};

function ExpenseChart({ expenses, onDeleteExpense, isUserLoggedIn, isLoadingExpenses, currency }) {
  const [selectedRange, setSelectedRange] = useState('month');
  const [selectedChart, setSelectedChart] = useState('doughnut');
  const [filteredExpenses, setFilteredExpenses] = useState([]);

  // Use custom hooks for chart data
  const chartData = useChartData(filteredExpenses);
  const trendData = useTrendData(expenses, selectedRange);
  const comparisonData = useComparisonData(expenses);

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
  }, [expenses, selectedRange]);

  const totalExpense = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      r: {
        ticks: {
          display: false // Hide the radial ticks
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)' // Subtle grid lines
        },
        beginAtZero: true,
        angleLines: {
          color: 'rgba(0, 0, 0, 0.05)' // Subtle angle lines
        }
      }
    },
    plugins: {
      legend: { 
        display: false 
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#333',
        bodyColor: '#666',
        bodyFont: {
          size: 14,
          weight: '600'
        },
        borderColor: '#e2e8f0',
        borderWidth: 1,
        caretSize: 8,
        cornerRadius: 12,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const percentage = ((value / totalExpense) * 100).toFixed(1);
            return [
              `${label}`,
              `${currency.symbol} ${value.toFixed(2)} (${percentage}%)`
            ];
          },
          labelTextColor: function(context) {
            return '#4a5568';
          },
          title: function(context) {
            return '💰 Expense Breakdown';
          }
        }
      }
    },
    animation: {
      animateScale: true,
      animateRotate: true,
      duration: 800,
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

  // Chart options
  const trendOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#333',
        bodyColor: '#666',
        bodyFont: { size: 14 },
        borderColor: '#ccc',
        borderWidth: 1,
        caretSize: 10,
        cornerRadius: 15,
        padding: 15,
        boxPadding: 5,
        callbacks: {
          label: function(context) {
            return `${currency.symbol} ${context.parsed.y.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false }
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return `${currency.symbol} ${value}`;
          }
        }
      }
    }
  };

  const comparisonOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#333',
        bodyColor: '#666',
        bodyFont: { size: 14 },
        borderColor: '#ccc',
        borderWidth: 1,
        caretSize: 10,
        cornerRadius: 15,
        padding: 15,
        boxPadding: 5,
        callbacks: {
          label: function(context) {
            return `${currency.symbol} ${context.parsed.y.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false }
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return `${currency.symbol} ${value}`;
          }
        }
      }
    }
  };

  return (
    <div className="expense-chart">
      <div className="chart-header">
        <h2>Stats</h2>
        <span>{getRangeText()}</span>
      </div>
      <>
        <div className="chart-controls">
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
          <div className="chart-type-selector">
            <button
              className={selectedChart === 'doughnut' ? 'active' : ''}
              onClick={() => setSelectedChart('doughnut')}
            >
              Distribution
            </button>
            <button
              className={selectedChart === 'trend' ? 'active' : ''}
              onClick={() => setSelectedChart('trend')}
            >
              Trend
            </button>
            <button
              className={selectedChart === 'comparison' ? 'active' : ''}
              onClick={() => setSelectedChart('comparison')}
            >
              Comparison
            </button>
          </div>
        </div>
        {filteredExpenses.length > 0 ? (
          <>
            <div className="chart-container">
              {selectedChart === 'doughnut' && (
                <PolarArea data={chartData} options={options} />
              )}
              {selectedChart === 'trend' && (
                <Line data={trendData} options={trendOptions} />
              )}
              {selectedChart === 'comparison' && (
                <Bar data={comparisonData} options={comparisonOptions} />
              )}
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
