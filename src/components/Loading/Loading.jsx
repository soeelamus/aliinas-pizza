import "./Loading.css";

const Loading = ({ innerHTML }) => {
  return (
    <div className="center margin">
      <p className="loader"></p>
      <p>{innerHTML}</p>
    </div>
  );
};

export default Loading;
