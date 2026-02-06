const Wave = ({
  height = 120,
  reverse = false,
  className = "",
}) => {
  return (
    <section className={`hero ${reverse && 'hero-reverse'}`}>
      <svg
        className={`wave ${reverse ? "reverse" : ""} ${className}`}
        viewBox={`0 0 1440 ${height}`}
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0,60 C240,100 480,20 720,40 960,60 1200,100 1440,40 L1440,120 L0,120 Z"
          fill="var(--primary-white)"
        />
      </svg>
    </section>
  );
};

export default Wave;
