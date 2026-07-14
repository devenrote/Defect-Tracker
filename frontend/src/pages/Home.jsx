import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { publicAPI } from '../services/api';
import toast from 'react-hot-toast';
import { 
  Bug, 
  FolderKanban, 
  Users, 
  TrendingUp, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Play, 
  Zap, 
  Activity, 
  FileSpreadsheet,
  X,
  Send,
  Mail,
  MapPin,
  Laptop
} from 'lucide-react';

const Home = () => {
  const { isAuthenticated } = useAuth();
  
  // Real stats state
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Demo Modal state
  const [showDemoModal, setShowDemoModal] = useState(false);

  // Contact form state
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submittingInquiry, setSubmittingInquiry] = useState(false);

  // SEO & Headings setup
  useEffect(() => {
    document.title = "Defect Tracker — Premium Enterprise Issue Tracking Workspace";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", "Align project managers, QA engineers, and developers with real-time statistics, Jira-style bug logs, and custom project spaces on PostgreSQL.");
    }
  }, []);

  // Fetch PostgreSQL-backed statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await publicAPI.getStats();
        setStats(res.data.data);
      } catch (err) {
        console.error('Failed to load database stats:', err);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const features = [
    {
      icon: <FolderKanban className="w-6 h-6 text-indigo-650" />,
      title: "Multi-Project Spaces",
      description: "Organize defects across multiple projects, each with custom keys, settings, and milestones."
    },
    {
      icon: <Bug className="w-6 h-6 text-rose-500" />,
      title: "Jira-Style Bug Reporting",
      description: "Report quality defects with rich text, attachments, drag-drop screenshot uploads, and priority weights."
    },
    {
      icon: <Users className="w-6 h-6 text-emerald-500" />,
      title: "Role-Based Workflows",
      description: "Custom dashboards for Admins, Project Managers, Testers, and Developers to manage their tasks."
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-amber-500" />,
      title: "Recharts Analytics",
      description: "Get real-time insights on defect counts, severity breakdowns, status trends, and monthly health curves."
    },
    {
      icon: <FileSpreadsheet className="w-6 h-6 text-cyan-600" />,
      title: "Spreadsheet Exports",
      description: "Download detailed quality reports directly into Excel and CSV formats for external sharing and audits."
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-violet-500" />,
      title: "Enterprise Security",
      description: "Protected route frames, secure JWT cookies, bcrypt encryption, and row-level administrative audits."
    }
  ];

  const steps = [
    {
      number: "01",
      role: "Admin & Managers",
      title: "Initialize Spaces",
      desc: "Create project backlogs, invite engineers, and assign PM roles to manage teams."
    },
    {
      number: "02",
      role: "Software Testers",
      title: "Find & Report",
      desc: "Perform runs, capture screenshots, and file defects with precise severity/priority mappings."
    },
    {
      number: "03",
      role: "Project Managers",
      title: "Triage & Assign",
      desc: "Review reported tickets, select milestone timelines, and assign tickets to developers."
    },
    {
      number: "04",
      role: "Developers",
      title: "Fix & Verify",
      desc: "Investigate comments, fix issues, upload code artifacts, and update status backboards."
    }
  ];

  // Smooth scroll helper
  const handleScrollTo = (e, id) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Contact Form Submission Handler
  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.subject.trim() || !contactForm.message.trim()) {
      toast.error('All inquiry fields are required');
      return;
    }
    
    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactForm.email.trim())) {
      toast.error('Please enter a valid business email address');
      return;
    }

    setSubmittingInquiry(true);
    try {
      await publicAPI.submitContact(contactForm);
      
      // Submit same data to Web3Forms for email routing
      const web3Response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          access_key: '7b5a906d-1b45-4d56-861a-09155eec40dd',
          name: contactForm.name,
          email: contactForm.email,
          subject: contactForm.subject,
          message: contactForm.message,
          from_name: 'Defect-Tracker'
        })
      });
      
      const web3Result = await web3Response.json();
      if (!web3Result.success) {
        throw new Error(web3Result.message || 'Email delivery failed via Web3Forms');
      }

      toast.success('Inquiry submitted successfully! Our team will reach out shortly.');
      setContactForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || 'Failed to submit inquiry. Please try again.');
    } finally {
      setSubmittingInquiry(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      
      {/* Grid background decoration */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none"></div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80 transition-all duration-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-200">
              <Bug className="w-5 h-5" />
            </div>
            <span className="text-base font-extrabold text-slate-900 tracking-tight">Defect Tracker</span>
          </div>

          <nav className="hidden lg:flex items-center gap-8 text-xs font-bold text-slate-500" aria-label="Main Navigation">
            <a href="#features" onClick={(e) => handleScrollTo(e, 'features')} className="hover:text-indigo-600 transition-colors">Features</a>
            <a href="#workflow" onClick={(e) => handleScrollTo(e, 'workflow')} className="hover:text-indigo-600 transition-colors">Workflow</a>
            <a href="#services" onClick={(e) => handleScrollTo(e, 'services')} className="hover:text-indigo-600 transition-colors">Services</a>
            <a href="#contact" onClick={(e) => handleScrollTo(e, 'contact')} className="hover:text-indigo-600 transition-colors">Contact</a>
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn-primary flex items-center gap-2 py-2 px-4 text-xs font-bold shadow-md shadow-indigo-150">
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors py-2 px-3">
                  Sign In
                </Link>
                <Link to="/register" className="btn-primary py-2 px-4 text-xs font-bold shadow-md shadow-indigo-150">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 md:pt-28 md:pb-32 px-6">
        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-50 border border-indigo-100/80 rounded-full text-indigo-700 text-xs font-semibold shadow-sm animate-pulse">
            <Zap className="w-3.5 h-3.5" />
            <span>Introducing Defect Tracker v1.0</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] max-w-4xl mx-auto">
            The premium issue tracker for <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent">high-velocity</span> development teams.
          </h1>

          <p className="text-base md:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Report bugs, manage project spaces, assign developer tasks, and verify quality metrics in a beautiful, light-themed workspace built on PostgreSQL and React.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn-primary px-8 py-3.5 text-sm font-bold shadow-lg shadow-indigo-100 flex items-center gap-2">
                Enter Dashboard <ArrowRight className="w-4.5 h-4.5" />
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn-primary px-8 py-3.5 text-sm font-bold shadow-lg shadow-indigo-100 flex items-center gap-2">
                  Start Free Trial <ArrowRight className="w-4.5 h-4.5" />
                </Link>
                <button 
                  onClick={() => setShowDemoModal(true)}
                  className="btn-secondary bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-8 py-3.5 text-sm font-bold shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-slate-500 text-slate-500" /> Watch Demo Run
                </button>
              </>
            )}
          </div>

          {/* Real Statistics Driven Dashboard Frame Mockup */}
          <div className="pt-12 md:pt-16">
            <div className="relative bg-white border border-slate-200 rounded-2xl shadow-premium p-3 md:p-4 max-w-4xl mx-auto">
              <div className="flex items-center gap-1.5 pb-3 border-b border-slate-100 px-1">
                <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                <div className="h-4.5 bg-slate-100 rounded-md px-3 text-[10px] text-slate-400 font-medium ml-4 w-48 text-left truncate">defecttracker.pro/dashboard</div>
              </div>
              
              {/* Mockup Dashboard Content Grid (Driven by real PostgreSQL stats) */}
              <div className="bg-slate-50/50 rounded-xl p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-left mt-3">
                <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex items-center justify-between hover:shadow-md transition-all duration-300">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reported Defects</span>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">
                      {statsLoading ? '—' : (stats ? stats.reportedDefects : 'No Data Available')}
                    </h3>
                  </div>
                  <div className="p-3 bg-indigo-50 text-indigo-655 rounded-xl">
                    <Bug className="w-5 h-5" />
                  </div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex items-center justify-between hover:shadow-md transition-all duration-300">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Workspace Users</span>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">
                      {statsLoading ? '—' : (stats ? stats.activeUsers : 'No Data Available')}
                    </h3>
                  </div>
                  <div className="p-3 bg-indigo-50 text-indigo-655 rounded-xl">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex items-center justify-between hover:shadow-md transition-all duration-300">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Verified / Resolved</span>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">
                      {statsLoading ? '—' : (stats ? stats.verifiedResolved : 'No Data Available')}
                    </h3>
                  </div>
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 bg-white border-y border-slate-200/60 px-6">
        <div className="max-w-6xl mx-auto space-y-14">
          <div className="text-center space-y-3">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Supercharge Quality Assurance</h2>
            <p className="text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
              Equip your software team with professional diagnostic tools designed to trace and resolve bugs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div 
                key={i} 
                tabIndex={0}
                className="bg-slate-50/50 hover:bg-white border border-slate-200/60 hover:border-indigo-300 p-6 rounded-2xl transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 flex flex-col items-start gap-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                  {f.icon}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 tracking-tight">{f.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed mt-2">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Timeline */}
      <section id="workflow" className="py-20 px-6">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-3">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">A Unified Workspace for Collaboration</h2>
            <p className="text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
              Follow our structural pipeline built to sync roles and speed up resolution.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {steps.map((s, i) => (
              <div 
                key={i} 
                tabIndex={0}
                className="space-y-4 relative flex flex-col items-start bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-3xl font-black text-slate-100 tracking-tight">{s.number}</span>
                  <span className="text-[10px] font-bold text-indigo-655 bg-indigo-50 border border-indigo-100 rounded-full px-2.5 py-0.5">{s.role}</span>
                </div>
                <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">{s.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-white border-y border-slate-200/60 px-6">
        <div className="max-w-6xl mx-auto space-y-14">
          <div className="text-center space-y-3">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Our Enterprise Services</h2>
            <p className="text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
              We offer bespoke solutions and implementation services to guarantee the success of your engineering organization.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-50/50 border border-slate-200/65 p-6 rounded-2xl flex items-start gap-4 hover:shadow-md hover:border-indigo-200 transition-all duration-300">
              <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm shrink-0">
                <FolderKanban className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800">Custom Tooling & Integrations</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Migrate your legacy data from JIRA, Bugzilla, or Redmine into Defect Tracker. We build custom data hooks, custom fields, and synchronize your Slack / Teams channels.
                </p>
              </div>
            </div>

            <div className="bg-slate-50/50 border border-slate-200/65 p-6 rounded-2xl flex items-start gap-4 hover:shadow-md hover:border-indigo-200 transition-all duration-300">
              <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm shrink-0">
                <ShieldCheck className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800">QA Consulting & Audit Setup</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Establish standard operational procedures for filing bugs and tracking SLAs. Our architects will construct custom status pipelines, verify templates, and train your staff.
                </p>
              </div>
            </div>

            <div className="bg-slate-50/50 border border-slate-200/65 p-6 rounded-2xl flex items-start gap-4 hover:shadow-md hover:border-indigo-200 transition-all duration-300">
              <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm shrink-0">
                <Zap className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800">Managed Dedicated Hosting</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Deploy Defect Tracker on a dedicated cloud cluster. Includes weekly automated PostgreSQL backups, secure VPC setups, regional data compliance, and 99.9% uptime guarantees.
                </p>
              </div>
            </div>

            <div className="bg-slate-50/50 border border-slate-200/65 p-6 rounded-2xl flex items-start gap-4 hover:shadow-md hover:border-indigo-200 transition-all duration-300">
              <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm shrink-0">
                <Activity className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800">24/7 Enterprise SLA Support</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Access a dedicated Slack channel with direct engineer-level support. We resolve configuration issues and deploy custom security patches under a 4-hour SLA.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-6">
        <div className="max-w-6xl mx-auto space-y-14">
          <div className="text-center space-y-3">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Connect With Us</h2>
            <p className="text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
              Have questions about pricing, self-hosting, or custom features? Drop us a line.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
            
            {/* Info panel (Displays ONLY real support info) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-50 border border-slate-200/70 p-6 rounded-2xl space-y-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 tracking-tight">Contact Information</h3>
                
                <div className="space-y-4 text-xs font-semibold">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-150 flex items-center justify-center text-indigo-650 text-xs shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Support Email</p>
                      <a href="mailto:support@defecttracker.com" className="text-slate-700 hover:text-indigo-600 transition-colors">support@defecttracker.com</a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-150 flex items-center justify-center text-indigo-655 text-xs shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Headquarters</p>
                      <p className="text-slate-700 leading-relaxed">San Francisco Workspace Area, California, USA</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fully Functional Contact Form */}
            <div className="lg:col-span-3">
              <form onSubmit={handleContactSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Your Name</label>
                    <input 
                      type="text" 
                      required 
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      disabled={submittingInquiry}
                      className="input-field text-xs py-2 bg-slate-50 border-slate-200 focus:bg-white" 
                      placeholder="John Doe" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Business Email</label>
                    <input 
                      type="email" 
                      required 
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      disabled={submittingInquiry}
                      className="input-field text-xs py-2 bg-slate-50 border-slate-200 focus:bg-white" 
                      placeholder="john@company.com" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Subject</label>
                  <input 
                    type="text" 
                    required 
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    disabled={submittingInquiry}
                    className="input-field text-xs py-2 bg-slate-50 border-slate-200 focus:bg-white" 
                    placeholder="e.g. Enterprise Self-Hosting Query" 
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Message</label>
                  <textarea 
                    required 
                    rows={4} 
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    disabled={submittingInquiry}
                    className="input-field text-xs py-2 bg-slate-50 border-slate-200 focus:bg-white resize-none" 
                    placeholder="Describe your team size, custom needs, or questions..." 
                  />
                </div>

                <div className="flex justify-end">
                  <button 
                    type="submit" 
                    disabled={submittingInquiry}
                    className="btn-primary px-6 py-2.5 text-xs font-bold shadow-md shadow-indigo-100 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {submittingInquiry ? 'Sending...' : 'Send Inquiry'}
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 pt-16 pb-12 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-slate-100">
            
            {/* Branding Column */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-100">
                  <Bug className="w-5 h-5" />
                </div>
                <span className="text-base font-extrabold text-slate-955 tracking-tight">Defect Tracker</span>
              </div>
              <p className="text-xs text-slate-500 max-w-sm leading-relaxed font-semibold">
                The enterprise-grade issue tracking platform built to align managers, testers, and developers on a unified quality engineering dashboard.
              </p>
              
              {/* System status dot */}
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="text-[10px] font-bold text-emerald-700">All Systems Operational</span>
              </div>
            </div>

            {/* Product Links */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Product</h4>
              <ul className="space-y-2 text-xs font-bold text-slate-500">
                <li><a href="#features" onClick={(e) => handleScrollTo(e, 'features')} className="hover:text-indigo-600 transition-colors">Features Matrix</a></li>
                <li><a href="#workflow" onClick={(e) => handleScrollTo(e, 'workflow')} className="hover:text-indigo-600 transition-colors">Workflow Pipeline</a></li>
                <li><a href="#services" onClick={(e) => handleScrollTo(e, 'services')} className="hover:text-indigo-600 transition-colors">Enterprise Services</a></li>
                <li><a href="#contact" onClick={(e) => handleScrollTo(e, 'contact')} className="hover:text-indigo-600 transition-colors">Contact Support</a></li>
              </ul>
            </div>

            {/* Role Workflows Links */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Workspaces</h4>
              <ul className="space-y-2 text-xs font-bold text-slate-500">
                <li><Link to="/login" className="hover:text-indigo-600 transition-colors">Project Manager Backlog</Link></li>
                <li><Link to="/login" className="hover:text-indigo-600 transition-colors">Tester Defect Log</Link></li>
                <li><Link to="/login" className="hover:text-indigo-600 transition-colors">Developer Taskboards</Link></li>
                <li><Link to="/login" className="hover:text-indigo-600 transition-colors">Admin Controller</Link></li>
              </ul>
            </div>

          </div>

          {/* Subfooter */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-400">
            <p>© {new Date().getFullYear()} Defect Tracker Inc. Enterprise QA Engine. All rights reserved.</p>
          </div>

        </div>
      </footer>

      {/* Demo Modal Overlay */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="bg-white dark:bg-slate-900 max-w-sm w-full rounded-2xl border border-slate-150 dark:border-slate-800 p-6 shadow-xl relative animate-scaleIn flex flex-col items-center text-center">
            
            <button 
              onClick={() => setShowDemoModal(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-650 cursor-pointer transition-colors"
              aria-label="Close Modal"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-650 rounded-xl flex items-center justify-center mb-4">
              <Laptop className="w-6 h-6" />
            </div>

            <h3 id="modal-title" className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Demo Coming Soon</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5 leading-relaxed font-semibold">
              The automated walkthrough recording is currently being prepared. Check back shortly to watch the live simulation run!
            </p>

            <button 
              onClick={() => setShowDemoModal(false)}
              className="btn-primary w-full py-2.5 mt-5 text-xs font-bold cursor-pointer"
            >
              Acknowledge
            </button>

          </div>
        </div>
      )}

    </div>
  );
};

export default Home;
