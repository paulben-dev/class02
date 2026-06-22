import { useParams } from 'react-router-dom';

export default function GradingDetail() {
  const { id } = useParams();

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: 24 }}>
      <h1>Grading Submission #{id}</h1>
      <p>Grading interface for this submission will go here.</p>
    </div>
  );
}
