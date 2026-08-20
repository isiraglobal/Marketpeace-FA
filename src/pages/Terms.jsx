import React from 'react';
import { motion } from 'framer-motion';
import { FileText, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <div className="w-full min-h-screen pt-24 sm:pt-32 md:pt-40 px-4 sm:px-6 md:px-8 flex flex-col items-center pb-16 sm:pb-20 md:pb-32">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-4xl w-full flex flex-col items-start mb-20 md:mb-32"
      >
        <Link to="/legal" className="flex items-center gap-2 text-[#0DB8D3] mb-12 md:mb-16 hover:opacity-80 transition-opacity">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-xs font-bold tracking-widest uppercase">Back to Legal</span>
        </Link>
        <FileText className="w-12 h-12 text-[#0DB8D3] mb-6" />
        <h1 className="text-2xl sm:text-4xl md:text-6xl font-black tracking-tighter mb-10 md:mb-12 uppercase italic text-white leading-[0.95] title">Terms & <span className="not-italic text-[#1B7FDC]">Conditions</span></h1>
        
        <div className="liquid-glass p-8 md:p-16 w-full space-y-12 text-white/50 font-medium leading-relaxed text-sm sm:text-base md:text-lg description">
          <section>
            <h2 className="text-2xl font-black text-white mb-6 uppercase italic title">1. Vendor Participation and Fees</h2>
            <p>
              Participation in the Marketpeace pop-up market requires a total investment of $250 (Standard booth) or $500 (Flagship booth).
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-4">
              <li>A $100 non-refundable deposit is required to lock your booth spot.</li>
              <li>The remaining balance ($150 Standard / $400 Flagship) must be paid within the balance window communicated in your offer email.</li>
              <li>Once a market reaches 70% capacity, remaining balances are due within 48 hours to secure your spot.</li>
              <li>Failure to pay the balance on time may result in placement on the waiting list or forfeiture of the spot and deposit.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-black text-white mb-6 uppercase italic title">2. Payments and Deposits</h2>
            <p>
              All payments are processed securely via Stripe. Vendors are responsible for ensuring accurate payment information is provided.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-white mb-6 uppercase italic title">3. Refund Policy</h2>
            <p>
              <strong className="text-white">All fees, including deposits and full balances, are non-refundable.</strong>
            </p>
            <p className="mt-4">
              In the event that a vendor cannot attend, the fee may be transferable to a future event at the discretion of Foreign Affairs LLC management, provided that notice is given at least 14 days in advance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-white mb-6 uppercase italic title">4. Booth Space and Logistics</h2>
            <p>
              Foreign Affairs LLC provides a 10' x 10' or 5' x 10' space (depending on the venue and package) including:
            </p>
            <ul className="list-disc pl-6 mt-4 space-y-4">
              <li>One 6ft table and one chair.</li>
              <li>Branded booth signage with your business name.</li>
              <li>Load-in and load-out must be completed during the designated times provided in the welcome packet.</li>
              <li>Vendors are responsible for their own displays, tents, and additional equipment.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-black text-white mb-6 uppercase italic title">5. Reserved Booths</h2>
            <p>
              Deposits paid mean the booth is reserved. At 70% capacity, unpaid vendors receive final notification and have 48 hours to pay their balance. Vendors who do not complete payment are moved to the waiting list and may be replaced.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-white mb-6 uppercase italic title">6. Liability and Insurance</h2>
            <p>
              Marketpeace maintains liability insurance for all curated events. However, vendors are encouraged to carry their own business insurance. Marketpeace is not responsible for any theft, damage, or loss of vendor property.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-white mb-6 uppercase italic title">7. Code of Conduct</h2>
            <p>
              We pride ourselves on a high-energy, community-focused environment. Vendors are expected to maintain a professional demeanor, respect fellow creators, and adhere to venue rules. Marketpeace reserves the right to remove any participant who violates this code of conduct without a refund.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-white mb-6 uppercase italic title">8. Referrals</h2>
            <p>
              Referral rewards are contingent on the referred party completing payment. Rewards are issued via Venmo, PayPal or CashApp on a bi-weekly payout cycle. Fraudulent or abusive referrals are void at Marketpeace's discretion.
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
