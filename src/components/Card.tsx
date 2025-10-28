import React, { type ReactNode } from 'react';
import './Card.css'; // We'll create this file next

// We define the types for this component's props
interface CardProps {
  title: string;
  children: ReactNode; // 'ReactNode' is the type for any valid React child
}

function Card({ title, children }: CardProps) {
  return (
    <div className="card">
      <h3 className="card-title">{title}</h3>
      <div className="card-content">
        {children}
      </div>
    </div>
  );
}

export default Card;