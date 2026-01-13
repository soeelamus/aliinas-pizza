import React from "react";

// Destructure 'order' direct uit de props
const Success = ({ order }) => {
  return (
    <>
      <p>Order placed successfully!</p>
      <p>Order ID: {order.id}</p>
    </>
  );
};

export default Success;
