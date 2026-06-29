import React from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <div className="w-full min-h-screen pt-20 sm:pt-24 md:pt-32 px-4 sm:px-6 md:px-8 flex flex-col items-center pb-12 sm:pb-16 md:pb-24">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-4xl w-full flex flex-col items-start mb-12 md:mb-20"
      >
        <Link to="/legal" className="flex items-center gap-2 text-[#0DB8D3] mb-8 md:mb-10 hover:opacity-80 transition-opacity">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-xs font-bold tracking-widest uppercase">Back to Legal</span>
        </Link>
        <Shield className="w-12 h-12 text-[#0DB8D3] mb-6" />
        <h1 className="text-2xl sm:text-4xl md:text-6xl font-black tracking-tighter mb-10 md:mb-12 uppercase italic title">Privacy <span className="not-italic text-[#1B7FDC]">Policy</span></h1>
        
        <div className="liquid-glass p-8 md:p-16 w-full space-y-12 text-white/50 font-medium leading-relaxed text-sm sm:text-base md:text-lg description">
          <section>
            <h2 className="text-2xl font-black text-white mb-6 uppercase italic">1. Information We Collect</h2>
            <p>
              Foreign Affairs LLC collects information from vendors, attendees, and partners to ensure successful event execution and marketing. This includes:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-4">
              <li>Contact details (Name, business name, phone number, email address).</li>
              <li>Social media handles (Instagram, TikTok, etc.) to promote your brand.</li>
              <li>Professional information related to your business or creative work.</li>
              <li>Payment information processed securely via Stripe.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-black text-white mb-6 uppercase italic title">2. How We Use Your Information</h2>
            <p>
              We use the collected information to:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-4">
              <li>Coordinate event logistics and vendor placement.</li>
              <li>Promote vendors to our network of 10,000+ followers across multiple platforms.</li>
              <li>Create custom marketing materials, such as "Meet the Vendor" series and event flyers.</li>
              <li>Communicate event updates, load-in instructions, and post-event recaps.</li>
              <li>Facilitate ticket sales and attendee check-ins.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-black text-white mb-6 uppercase italic title">3. Information Sharing</h2>
            <p>
              We do not sell your personal data. However, we share specific information to maximize your brand's exposure:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-4">
              <li><strong>Public Promotion:</strong> Business names and social handles are featured in our marketing content.</li>
              <li><strong>Venue Partners:</strong> Basic vendor lists may be shared with our venue partners for security and logistical purposes.</li>
              <li><strong>Promoter Network:</strong> Our national promoter team may access attendee numbers to track growth and performance.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-black text-white mb-6 uppercase italic title">4. Content and Media</h2>
            <p>
              By participating in a Foreign Affairs event, you acknowledge that professional photography and videography will be taken.
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-4">
              <li>These assets will be used for promotional purposes on our social media, website, and future event materials.</li>
              <li>Vendors will receive access to high-resolution photos and video clips of their booth and products for their own professional use.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-black text-white mb-6 uppercase italic title">5. Your Choices</h2>
            <p>
              You can request to update or remove your professional information from our active marketing campaigns at any time by contacting us at foreignaffairsllc2017@gmail.com. Please note that information already included in printed materials or historical social media posts may not be removable.
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
