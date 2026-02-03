import "./Loading.css";

const Loading = ({ innerHTML, margin = '' }) => {
  return (
    <div className={`center ${margin ? `margin-${margin}` : 'margin'}`}>
      <p className="loader"></p>
      <p>{innerHTML}</p>
    </div>
  );
};

export default Loading;
