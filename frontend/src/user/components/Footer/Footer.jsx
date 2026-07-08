import React from 'react'
import './Footer.css'
import { assets } from '../../assets/assets'

const Footer = () => {
  return (
    <div className='footer' id='footer'>
      <div className='footer-content'>
        <div className='footer-content-left'>
          <div className="footer-logo">
            <img src={assets.logo} alt='KIITEats' />
          </div>
          <p>KIITEats is a campus-focused food ordering prototype with dark mode, veg filtering, grouped carts, pre-booked pickup slots and local order history.</p>
          <div className='footer-social-icons'>
            <img src={assets.facebook_icon} alt='Facebook' />
            <img src={assets.twitter_icon} alt='Twitter' />
            <img src={assets.linkedin_icon} alt='LinkedIn' />
          </div>
        </div>
        <div className='footer-content-center'>
          <h2>PRODUCT</h2>
          <ul>
            <li>Campus vendors</li>
            <li>Group ordering</li>
            <li>Live tracking</li>
            <li>Theme persistence</li>
          </ul>
        </div>
        <div className='footer-content-right'>
          <h2>CONTACT</h2>
          <ul>
            <li>+91 98765 43210</li>
            <li>support@kiiteats.in</li>
            <li>Bhubaneswar, Odisha</li>
          </ul>
        </div>
      </div>
      <hr />
      <p className='footer-copyright'>Copyright 2026 © KIITEats - Demo student project.</p>
    </div>
  )
}

export default Footer
