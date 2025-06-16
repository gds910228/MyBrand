"use client";

import React from 'react';
import Container from './Container';

interface SectionProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
  bgColor?: string;
  padding?: string;
}

const Section: React.FC<SectionProps> = ({
  children,
  id,
  className = '',
  bgColor = '',
  padding = 'py-16 md:py-24',
}) => {
  return (
    <section
      id={id}
      className={`${bgColor} ${padding} ${className}`}
    >
      <Container>
        {children}
      </Container>
    </section>
  );
};

export default Section; 