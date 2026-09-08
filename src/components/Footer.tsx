import React from 'react';
import { STORE_INFO } from '../data/initialProducts';
import {
  Wrench,
  Phone,
  MapPin,
  Clock,
  Shield,
  MessageCircle,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface FooterProps {
  onOpenAdmin: () => void;
  isAdminLoggedIn: boolean;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAdmin, isAdminLoggedIn }) => {
  return (
    <footer className="bg-stone-950 text-stone-300 border-t border-stone-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-stone-950">
                <Wrench className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="text-base font-black text-white tracking-tight">
                BORA <span className="text-amber-400 font-light">HARDWARE</span>
              </span>
            </div>
            <p className="text-stone-400 text-xs leading-relaxed">
              Your dependable partner for building materials in Kenya. Supplying Simba Cement 50kg,
              structural steel, Mabati roofing, and construction hardware directly to your site.
            </p>
          </div>

          {/* Quick Contacts */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-100">
              Orders & Dispatch
            </h4>
            <div className="space-y-2 text-stone-400">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Call: {STORE_INFO.whatsappNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <a
                  href={`https://wa.me/${STORE_INFO.cleanPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white underline"
                >
                  WhatsApp: {STORE_INFO.whatsappNumber}
                </a>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>{STORE_INFO.location}</span>
              </div>
            </div>
          </div>

          {/* Business Hours */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-100">
              Yard Working Hours
            </h4>
            <div className="space-y-1.5 text-stone-400">
              <div className="flex items-start gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-stone-300">Monday — Saturday</p>
                  <p className="text-[11px]">8:00 AM – 09:30 PM</p>
                </div>
              </div>
              <div className="pl-5 text-[11px]">
                <p className="font-semibold text-stone-300">Sunday & Public Holidays</p>
                <p>01:00 PM – 09:00 PM</p>
              </div>
            </div>
          </div>

          {/* Delivery & Payment Assurance */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-100">
              Payment & Delivery
            </h4>
            <ul className="space-y-1.5 text-stone-400 text-[11px]">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Pay on site verification</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>M-Pesa Buy Goods & Paybill accepted</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Truck dispatch for bulk cement & steel</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar with Hidden Staff Entry */}
        <div className="mt-8 pt-6 border-t border-stone-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-stone-500 text-[11px]">
          <div>
            © {new Date().getFullYear()} Bora Hardware. All rights reserved. Registered in Kenya.
          </div>

          {/* Discrete hidden portal link as requested: "hide the admin page in the dashboard only the admin is the person able to see it" */}
          <div className="flex items-center gap-4">
            <button
              onClick={onOpenAdmin}
              id="footer-hidden-staff-portal"
              className="text-stone-600 hover:text-stone-400 transition-colors flex items-center gap-1 text-[10px]"
              title="Restricted Staff Entry (Mbithi only)"
            >
              <Lock className="w-3 h-3 text-stone-600" />
              <span>{isAdminLoggedIn ? 'Admin Console (Active)' : 'Staff Portal'}</span>
            </button>
            <span className="text-stone-700 text-[10px] hidden sm:inline">
              (or press Ctrl+Shift+A)
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
