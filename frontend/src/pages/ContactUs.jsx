import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ContactUs() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.fullName || '',
    email: user?.email || '',
    subject: '',
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg('');
    setIsSuccess(false);

    try {
      // Send directly to Web3Forms API
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          access_key: 'e0aac42d-b711-433f-8fe4-10136ead076d',
          name: formData.name,
          email: formData.email,
          subject: formData.subject || 'Finova Support Query',
          message: formData.message
        })
      });

      const result = await response.json();
      if (result.success) {
        setIsSuccess(true);
        setStatusMsg('Thank you! Your message has been sent successfully to Finova Support.');
        setFormData({
          name: user?.fullName || '',
          email: user?.email || '',
          subject: '',
          message: ''
        });
      } else {
        setIsSuccess(false);
        setStatusMsg(result.message || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      setIsSuccess(false);
      setStatusMsg('Network error. Failed to connect to Web3Forms contact server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center mx-auto shadow-lg shadow-teal-500/10">
          <MessageSquare className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-extrabold text-white">Contact Finova Support</h1>
        <p className="text-xs text-slate-400 max-w-md mx-auto">Have questions or need assistance? Reach out to our 24/7 payment support team.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact Information Sidebar */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">Get in Touch</h3>

          <div className="space-y-4 text-xs">
            <div className="flex items-start space-x-3 text-slate-300">
              <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 flex-shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-white">Email Support</p>
                <p className="text-slate-400 text-[11px]">support@finova.com</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 text-slate-300">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 flex-shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-white">Helpline</p>
                <p className="text-slate-400 text-[11px]">1800-123-FINOVA (Toll Free)</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 text-slate-300">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 flex-shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-white">Headquarters</p>
                <p className="text-slate-400 text-[11px]">Finova Tower, Cyber City, India</p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-teal-500/5 border border-teal-500/10 text-teal-400 text-[11px]">
            <p className="font-bold mb-1">⚡ Fast Response</p>
            <p className="text-slate-400">Our support engineers typically reply within 15 minutes.</p>
          </div>
        </div>

        {/* Web3Forms Contact Form */}
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <h3 className="text-base font-bold text-white">Send Us a Direct Message</h3>

          {statusMsg && (
            <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center space-x-2.5 ${
              isSuccess
                ? 'bg-teal-500/10 border-teal-500/30 text-teal-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
              {isSuccess ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
              <span>{statusMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Your Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Full name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Your Email Address</label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Subject</label>
              <input
                type="text"
                name="subject"
                required
                placeholder="What is your query regarding?"
                value={formData.subject}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Message</label>
              <textarea
                name="message"
                required
                rows={4}
                placeholder="Describe your issue or feedback in detail..."
                value={formData.message}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-teal-500/20 flex items-center justify-center space-x-2 transition"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'Sending Message via Web3Forms...' : 'Submit Message'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
