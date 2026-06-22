import { Link } from 'react-router-dom';

export default function GradingList() {
  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: 24 }}>
      <h1>Grading</h1>
      <p>List of submitted homework for grading.</p>
      <p><Link to="/grading/1">View sample submission #1</Link></p>
    </div>
  );
}
