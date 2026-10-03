import React, { useEffect, useRef, useState } from 'react';

// The width of a .doc sheet (A4 at 96dpi) plus its 1px border on each side
const SHEET_WIDTH = 796;

// The grey desk a paper document lies on. The sheet always keeps its A4 proportions:
// when the desk is narrower than the sheet (a phone, a narrow column), the sheet is
// scaled down to fit, the way a PDF viewer fits a page to the window.
const DocumentDesk = ({ className = '', children }) => {
  const deskRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const desk = deskRef.current;
    if (!desk) return undefined;

    const fit = () => {
      const style = getComputedStyle(desk);
      const available = desk.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      if (available > 0) setScale(Math.min(1, available / SHEET_WIDTH));
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(desk);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={deskRef} className={`bg-gray-100 p-3 sm:p-8 ${className}`}>
      <div className="mx-auto w-fit overflow-hidden rounded-lg border border-gray-200" style={{ zoom: scale }}>
        {children}
      </div>
    </div>
  );
};

export default DocumentDesk;
