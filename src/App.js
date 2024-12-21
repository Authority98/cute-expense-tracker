import React, { useState, useEffect, useCallback } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { signInWithPopup, signOut } from 'firebase/auth';
import { collection, addDoc, query, orderBy, limit, onSnapshot, deleteDoc, doc, setDoc, writeBatch, getDocs, where } from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';
import ExpenseTracker from './components/ExpenseTracker';
import ExpenseChart from './components/ExpenseChart';
import DarkModeToggle from './components/DarkModeToggle';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import './styles/LiquidLoading.css';
import { FaSignOutAlt, FaGoogle, FaTrash } from 'react-icons/fa';
import { addDays, addWeeks, addMonths, addYears, isBefore, isAfter } from 'date-fns';

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

function App() {
  const [user, loading] = useAuthState(auth);
  const [expenses, setExpenses] = useState([]);
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(true);
  const [localExpenses, setLocalExpenses] = useState([]);
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });
  const [currency, setCurrency] = useState(() => {
    const savedCurrency = localStorage.getItem('currency');
    return savedCurrency ? JSON.parse(savedCurrency) : currencies.find(c => c.code === 'PKR');
  });
  const [isProcessingRecurring, setIsProcessingRecurring] = useState(false);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('currency', JSON.stringify(currency));
  }, [currency]);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  const fetchExpenses = useCallback(() => {
    if (user) {
      setIsLoadingExpenses(true);
      console.log("User logged in, fetching expenses");
      const q = query(collection(db, `users/${user.uid}/expenses`), orderBy('date', 'desc'), limit(100));
      return onSnapshot(q, 
        (querySnapshot) => {
          let expensesData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
          console.log("Fetched expenses:", expensesData);
          setExpenses(expensesData);
          setIsLoadingExpenses(false);
        }, 
        (error) => {
          console.error("Error fetching expenses:", error);
          toast.error(`Failed to fetch expenses: ${error.message}`);
          setIsLoadingExpenses(false);
        }
      );
    } else {
      console.log("User not logged in, using local expenses");
      setExpenses(localExpenses);
      setIsLoadingExpenses(false);
      return () => {};
    }
  }, [user, localExpenses]);

  useEffect(() => {
    let unsubscribe = () => {};
    if (!loading) { // Only fetch expenses when auth state is determined
      if (user) {
        unsubscribe = fetchExpenses();
      } else {
        setExpenses(localExpenses);
        setIsLoadingExpenses(false);
      }
    }
    return () => {
      console.log("Unsubscribing from expenses listener");
      unsubscribe();
    };
  }, [user, fetchExpenses, localExpenses, loading]);

  const addExpense = async (expense) => {
    try {
      const expenseWithDate = {
        ...expense,
        date: new Date(expense.date).toISOString(),
        ...(expense.isRecurring && {
          nextDueDate: new Date(expense.date).toISOString(),
          endDate: expense.endDate ? new Date(expense.endDate).toISOString() : null,
          lastProcessedDate: null,
          status: 'active'
        })
      };

      console.log("Adding expense:", expenseWithDate);
      
      if (user) {
        // If user is logged in, add to Firestore
        const collectionRef = collection(db, `users/${user.uid}/expenses`);
        const docRef = await addDoc(collectionRef, expenseWithDate);
        
        // If it's a recurring expense, also add to recurring collection
        if (expense.isRecurring) {
          const recurringRef = collection(db, `users/${user.uid}/recurring_expenses`);
          await addDoc(recurringRef, {
            ...expenseWithDate,
            originalExpenseId: docRef.id
          });
        }
        
        console.log("Expense added to Firestore with ID:", docRef.id);
      } else {
        // If user is not logged in, add to local state with a temporary ID
        const newLocalExpense = { 
          ...expenseWithDate, 
          id: `local_${Date.now()}`,
          isLocal: true
        };
        setLocalExpenses(prevExpenses => [...prevExpenses, newLocalExpense]);
        setExpenses(prevExpenses => [...prevExpenses, newLocalExpense]);
      }
      
      console.log("Expense added successfully");
      toast.success('Expense added successfully! 🎉');
    } catch (error) {
      console.error("Error adding expense: ", error);
      toast.error('Failed to add expense. Please try again.');
    }
  };

  const deleteExpense = async (id) => {
    if (user) {
      try {
        await deleteDoc(doc(db, `users/${user.uid}/expenses`, id));
        setExpenses(prevExpenses => prevExpenses.filter(expense => expense.id !== id));
        toast.info('Expense deleted! 🗑️');
      } catch (error) {
        console.error("Error deleting expense: ", error);
        toast.error('Failed to delete expense. Please try again.');
      }
    } else {
      // For local expenses
      setExpenses(prevExpenses => prevExpenses.filter(expense => expense.id !== id));
      toast.info('Expense deleted! 🗑️');
    }
  };

  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Signed in successfully!');
    } catch (error) {
      console.error("Error signing in with Google:", error.code, error.message);
      toast.error(`Failed to sign in: ${error.message}`);
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
      setExpenses([]);
      setLocalExpenses([]);
      setIsLoadingExpenses(false);
      toast.success('Signed out successfully!');
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error('Failed to sign out. Please try again.');
    }
  };

  const clearAllExpenses = async () => {
    if (user && expenses.length > 0) {
      const confirmClear = window.confirm("Are you sure you want to clear all expenses? This action cannot be undone.");
      if (confirmClear) {
        setIsLoadingExpenses(true);
        try {
          const batch = writeBatch(db);
          expenses.forEach((expense) => {
            const expenseRef = doc(db, `users/${user.uid}/expenses`, expense.id);
            batch.delete(expenseRef);
          });
          await batch.commit();
          setExpenses([]);
          toast.success('All expenses cleared successfully!');
        } catch (error) {
          console.error("Error clearing expenses:", error);
          toast.error('Failed to clear expenses. Please try again.');
        } finally {
          setIsLoadingExpenses(false);
        }
      }
    }
  };

  useEffect(() => {
    const mergeLocalExpenses = async () => {
      if (user && localExpenses.length > 0) {
        console.log("Merging local expenses with Firestore");
        const batch = writeBatch(db);
        for (const localExpense of localExpenses) {
          const newDocRef = doc(collection(db, `users/${user.uid}/expenses`));
          batch.set(newDocRef, { ...localExpense, id: newDocRef.id });
        }
        await batch.commit();
        setLocalExpenses([]);
        console.log("Local expenses merged with Firestore");
      }
    };

    if (user) {
      mergeLocalExpenses();
    }
  }, [user, localExpenses, db]);

  const processRecurringExpenses = async () => {
    if (!user || isProcessingRecurring) return;

    try {
      setIsProcessingRecurring(true);
      const recurringRef = collection(db, `users/${user.uid}/recurring_expenses`);
      const q = query(recurringRef, where('status', '==', 'active'));
      const querySnapshot = await getDocs(q);

      const batch = writeBatch(db);
      const now = new Date();
      let hasChanges = false;

      for (const doc of querySnapshot.docs) {
        const recurring = doc.data();
        const nextDue = new Date(recurring.nextDueDate);

        // Skip if next due date is in the future
        if (isAfter(nextDue, now)) continue;

        // Skip if end date exists and has passed
        if (recurring.endDate && isAfter(now, new Date(recurring.endDate))) {
          batch.update(doc.ref, { status: 'completed' });
          hasChanges = true;
          continue;
        }

        // Calculate next due date based on frequency
        let nextDueDate;
        switch (recurring.frequency) {
          case 'daily':
            nextDueDate = addDays(nextDue, 1);
            break;
          case 'weekly':
            nextDueDate = addWeeks(nextDue, 1);
            break;
          case 'monthly':
            nextDueDate = addMonths(nextDue, 1);
            break;
          case 'yearly':
            nextDueDate = addYears(nextDue, 1);
            break;
          default:
            continue;
        }

        // Create new expense
        const expenseRef = doc(collection(db, `users/${user.uid}/expenses`));
        batch.set(expenseRef, {
          item: recurring.item,
          amount: recurring.amount,
          date: now.toISOString(),
          isRecurring: true,
          recurringId: doc.id
        });

        // Update recurring expense
        batch.update(doc.ref, {
          lastProcessedDate: now.toISOString(),
          nextDueDate: nextDueDate.toISOString()
        });

        hasChanges = true;
      }

      if (hasChanges) {
        await batch.commit();
        fetchExpenses(); // Refresh expenses list
      }
    } catch (error) {
      console.error("Error processing recurring expenses:", error);
      toast.error('Failed to process recurring expenses');
    } finally {
      setIsProcessingRecurring(false);
    }
  };

  useEffect(() => {
    if (user) {
      // Process recurring expenses when component mounts and every hour
      processRecurringExpenses();
      const interval = setInterval(processRecurringExpenses, 60 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user]);

  console.log("Current state:", { user, loading, isLoadingExpenses, expensesCount: expenses.length });

  return (
    <div className={`App ${darkMode ? 'dark-mode' : ''}`}>
      <div className="app-container">
        <div className="user-menu">
          <div className="user-menu-left">
            <DarkModeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            {loading ? (
              <div className="loading-text">Loading...</div>
            ) : user ? (
              <div className="user-menu-content">
                <span className="greeting">Hi, {user.displayName}!</span>
                <button className="sign-out-btn" onClick={signOutUser}>
                  <FaSignOutAlt /> Sign Out
                </button>
              </div>
            ) : (
              <div className="user-menu-content">
                <span className="greeting">Login to save your data</span>
                <button className="sign-in-btn" onClick={signIn}>
                  <FaGoogle /> Sign In
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="left-column">
          <div className="expense-tracker-container">
            <ExpenseTracker 
              onAddExpense={addExpense} 
              isUserLoggedIn={!!user}
              currency={currency}
            />
          </div>
        </div>
        <div className="expense-chart-container">
          <ExpenseChart 
            expenses={expenses} 
            onDeleteExpense={deleteExpense} 
            isUserLoggedIn={!!user}
            isLoadingExpenses={isLoadingExpenses || loading}
            currency={currency}
          />
        </div>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        className="toast-container"
      />
    </div>
  );
}

export default App;
