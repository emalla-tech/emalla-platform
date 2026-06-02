import React from 'react';
import { Link, useLocation } from 'react-router-dom';

type NavItem = {
  to: string;
  label: string;
  icon: React.ReactElement;
};

interface MobileBottomNavProps {
  items: NavItem[];
  accentClass?: string;
  backgroundClass?: string;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  items,
  accentClass = 'text-orange-500',
  backgroundClass = 'bg-white/92'
}) => {
  const location = useLocation();

  const isActive = (to: string) =>
    location.pathname === to || (to !== '/' && location.pathname.startsWith(`${to}/`));

  return (
    <nav
      className={`mobile-bottom-nav md:hidden ${backgroundClass}`}
      aria-label="Mobile app navigation"
    >
      <div className="mobile-bottom-nav__inner">
        {items.map((item) => {
          const active = isActive(item.to);

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`mobile-bottom-nav__item ${active ? 'mobile-bottom-nav__item--active' : ''}`}
            >
              <span className={`mobile-bottom-nav__icon ${active ? accentClass : 'text-gray-400'}`}>
                {React.cloneElement(item.icon, {
                  size: 20,
                  strokeWidth: active ? 2.4 : 2
                })}
              </span>
              <span className={`mobile-bottom-nav__label ${active ? accentClass : 'text-gray-400'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
