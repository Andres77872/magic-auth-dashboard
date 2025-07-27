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
              aria-label="Open documentation in new tab"
            >
              Documentation
            </a>
            <a 
              href="/support" 
              className="footer-link"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open support page in new tab"
            >
              Support
            </a>
            <a 
              href="mailto:admin@magicauth.com" 
              className="footer-link"
              aria-label="Send email to admin"
            >
              Contact
            </a>
            <a 
              href="/privacy" 
              className="footer-link"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View privacy policy"
            >
              Privacy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer; 