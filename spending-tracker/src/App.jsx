import { BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { useState } from 'react'
import './App.css'
import Papa from 'papaparse'

const categoryKeywords = {
  Groceries: ['tesco', 'sainsbury', 'asda'],
  Transport: ['uber', 'trainline'],
  Eating: ['nandos', 'just eat', 'deliveroo'],
  Entertainment: ['netflix', 'amazon prime'],
};

function getCategoryTotals(items) {
  const totals = {};
  items.forEach((t) => {
    totals[t.category] = (totals[t.category] || 0) + (t.amount || 0);
  });
  return Object.entries(totals).map(([category, total]) => ({ category, total }));
}

function categorise(description) {
  const desc = description.toLowerCase();
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some((k) => desc.includes(k))) {
      return category;
    }
  }
  return 'Other';
}

function flagAnomalies(items) {
  const byCategory = {};
  items.forEach((t) => {
    if (!byCategory[t.category]) byCategory[t.category] = [];
    byCategory[t.category].push(t.amount);
  });

  const stats = {};
  for (const [category, amounts] of Object.entries(byCategory)) {
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const variance =
      amounts.reduce((a, b) => a + (b - mean) ** 2, 0) / amounts.length;
    stats[category] = { mean, stdDev: Math.sqrt(variance) };
  }

  return items.map((t) => {
    const { mean, stdDev } = stats[t.category];
    const isAnomaly = stdDev > 0 && t.amount > mean + 1.5 * stdDev;
    return { ...t, isAnomaly };
  });
}

function App() {
  const [transactions, setTransactions] = useState([]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      complete: (results) => {
        setTransactions(results.data);
        console.log(results.data);
      }
    });
  };

  const categorised = transactions.map((t) => ({
    ...t,
    category: categorise(t.description || ''),
  }));

  const flagged = flagAnomalies(categorised);

  const total = flagged.reduce((sum, t) => sum + (t.amount || 0), 0);
  const anomalyCount = flagged.filter((t) => t.isAnomaly).length;

  return (
    <div>
      <input type="file" accept='.csv' onChange={handleFileUpload}></input>

      <div>
        <p>Total spend: £{total.toFixed(2)}</p>
        <p>Transactions: {flagged.length}</p>
        <p>Flagged as unusual: {anomalyCount}</p>
      </div>

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Amount</th>
            <th>Categories</th>
          </tr>
        </thead>
        <tbody>
          {flagged.map((t, i) => (
            <tr key={i} style={{ backgroundColor: t.isAnomaly ? '#ffdddd' : 'transparent' }}>
              <td>{t.date}</td>
              <td>{t.description}</td>
              <td>{t.amount}</td>
              <td>{t.category}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <BarChart width={500} height={300} data={getCategoryTotals(categorised)}>
        <XAxis dataKey="category" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="total" fill="#8884d8" />
      </BarChart>
    </div>
  )
}

export default App