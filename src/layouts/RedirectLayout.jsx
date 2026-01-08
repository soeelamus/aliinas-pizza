import React from "react";
import { Outlet } from "react-router-dom";

const RedirectLayout = () => {
  return (
    <>
      <Outlet />
    </>
  );
};

export default RedirectLayout;
