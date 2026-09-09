import React from 'react';

/**
 * RobotFace — el "robotsito" del Tutor IA, dibujado 100 % con CSS para que se
 * sienta vivo: flota con un suave vaivén, parpadea los ojos y enciende su
 * antena. Hereda el color con `currentColor`, así se adapta al ámbar del
 * lanzador flotante, a la cabecera del chat o a las burbujas azules sin más
 * prop que el tamaño (`className` con w/h).
 */
export const RobotFace: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span aria-hidden className={`rf ${className}`}>
    <span className="rf-head">
      <span className="rf-eye rf-eye-l" />
      <span className="rf-eye rf-eye-r" />
      <span className="rf-mouth" />
    </span>
    <span className="rf-antenna" />
  </span>
);
