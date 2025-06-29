import React from 'react';

export function Footer(): React.JSX.Element {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="dashboard-footer" role="contentinfo">
      <div className="footer-content">
        <div className="footer-left">
          <span className="copyright">
            © {currentYear} Magic Auth Dashboard. All rights reserved.
          </span>
        </div>
        
        <div className="footer-right">
          <div className="footer-links">
            <a 
              href="/docs" 
              className="footer-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              Documentation
            </a>
            <a 
              href="/support" 
              className="footer-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              Support
            </a>
            <a 
              href="mailto:admin@magicauth.com" 
              className="footer-link"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer; 