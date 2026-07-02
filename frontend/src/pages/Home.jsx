import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
  FileSpreadsheet 
} from 'lucide-react';

const Home = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: <FolderKanban className="w-6 h-6 text-indigo-600" />,
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

          <nav className="hidden lg:flex items-center gap-8 text-xs font-bold text-slate-500">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
            <a href="#workflow" className="hover:text-indigo-600 transition-colors">Workflow</a>
            <a href="#services" className="hover:text-indigo-600 transition-colors">Services</a>
            <a href="#contact" className="hover:text-indigo-600 transition-colors">Contact</a>
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
                <Link to="/login" className="btn-secondary bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-8 py-3.5 text-sm font-bold shadow-sm flex items-center gap-2">
                  <Play className="w-4 h-4 fill-slate-500 text-slate-500" /> Watch Demo Run
                </Link>
              </>
            )}
          </div>

          {/* SaaS Interface Mockup Frame */}
          <div className="pt-12 md:pt-16">
            <div className="relative bg-white border border-slate-200 rounded-2xl shadow-premium p-3 md:p-4 max-w-4xl mx-auto">
              <div className="flex items-center gap-1.5 pb-3 border-b border-slate-100 px-1">
                <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                <div className="h-4.5 bg-slate-100 rounded-md px-3 text-[10px] text-slate-400 font-medium ml-4 w-48 text-left truncate">defecttracker.pro/dashboard</div>
              </div>
              
              {/* Mockup Dashboard Content Grid */}
              <div className="bg-slate-50/50 rounded-xl p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-left mt-3">
                <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reported Defects</span>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">24</h3>
                  </div>
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Bug className="w-5 h-5" />
                  </div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">In Progress</span>
                    <h3 className="text-2xl font-black text-slate-850 mt-1">12</h3>
                  </div>
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                    <Activity className="w-5 h-5" />
                  </div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Verified Fixed</span>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">8</h3>
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
              <div key={i} className="bg-slate-50/50 hover:bg-slate-50 border border-slate-200/60 hover:border-slate-350 p-6 rounded-2xl transition-all duration-200 shadow-sm flex flex-col items-start gap-4">
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
              <div key={i} className="space-y-4 relative flex flex-col items-start bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between w-full">
                  <span className="text-3xl font-black text-slate-100 tracking-tight">{s.number}</span>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-2.5 py-0.5">{s.role}</span>
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
            <div className="bg-slate-50/50 border border-slate-200/65 p-6 rounded-2xl flex items-start gap-4">
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

            <div className="bg-slate-50/50 border border-slate-200/65 p-6 rounded-2xl flex items-start gap-4">
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

            <div className="bg-slate-50/50 border border-slate-200/65 p-6 rounded-2xl flex items-start gap-4">
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

            <div className="bg-slate-50/50 border border-slate-200/65 p-6 rounded-2xl flex items-start gap-4">
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
            
            {/* Info panel */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-50 border border-slate-200/70 p-6 rounded-2xl space-y-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 tracking-tight">Contact Information</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-150 flex items-center justify-center text-indigo-600 text-xs">
                      📧
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Sales & Support</p>
                      <a href="mailto:support@defecttracker.com" className="text-xs font-semibold text-slate-700 hover:text-indigo-650 transition-colors">support@defecttracker.com</a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-150 flex items-center justify-center text-indigo-600 text-xs">
                      📞
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Phone Support</p>
                      <p className="text-xs font-semibold text-slate-700">+1 (800) 555-0199</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-150 flex items-center justify-center text-indigo-600 text-xs">
                      📍
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Headquarters</p>
                      <p className="text-xs font-semibold text-slate-700 leading-relaxed">100 Pine Street, San Francisco, CA 94111</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Panel */}
            <div className="lg:col-span-3">
              <form onSubmit={(e) => { e.preventDefault(); alert('Message sent successfully! Our team will reach out shortly.'); }} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Your Name</label>
                    <input type="text" required className="input-field text-sm" placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Business Email</label>
                    <input type="email" required className="input-field text-sm" placeholder="john@company.com" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Subject</label>
                  <input type="text" required className="input-field text-sm" placeholder="e.g. Enterprise Migration Quote" />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Message</label>
                  <textarea required rows={4} className="input-field text-sm" placeholder="Describe your team size, custom needs, or questions..." />
                </div>

                <div className="flex justify-end">
                  <button type="submit" className="btn-primary px-6 py-2.5 text-xs font-bold shadow-md shadow-indigo-100 cursor-pointer">
                    Send Inquiry
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-100">
            
            {/* Branding Column */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-100">
                  <Bug className="w-5 h-5" />
                </div>
                <span className="text-base font-extrabold text-slate-950 tracking-tight">Defect Tracker</span>
              </div>
              <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
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
              <ul className="space-y-2 text-xs font-semibold text-slate-500">
                <li><a href="#features" className="hover:text-indigo-600 transition-colors">Features Matrix</a></li>
                <li><a href="#workflow" className="hover:text-indigo-600 transition-colors">Workflow Pipeline</a></li>
                <li><a href="#services" className="hover:text-indigo-600 transition-colors">Enterprise Services</a></li>
                <li><a href="#contact" className="hover:text-indigo-600 transition-colors">Contact Support</a></li>
              </ul>
            </div>

            {/* Role Workflows Links */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Workspaces</h4>
              <ul className="space-y-2 text-xs font-semibold text-slate-500">
                <li><Link to="/login" className="hover:text-indigo-600 transition-colors">Project Manager Backlog</Link></li>
                <li><Link to="/login" className="hover:text-indigo-600 transition-colors">Tester Defect Log</Link></li>
                <li><Link to="/login" className="hover:text-indigo-600 transition-colors">Developer Taskboards</Link></li>
                <li><Link to="/login" className="hover:text-indigo-600 transition-colors">Admin Controller</Link></li>
              </ul>
            </div>

            {/* Company & Legal Links */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Resources</h4>
              <ul className="space-y-2 text-xs font-semibold text-slate-500">
                <li><a href="#" className="hover:text-indigo-600 transition-colors">API Docs</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Security Audit</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Terms of Service</a></li>
              </ul>
            </div>

          </div>

          {/* Subfooter */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-400">
            <p>© {new Date().getFullYear()} Defect Tracker Inc. Enterprise QA Engine. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-indigo-600 transition-colors">Terms</a>
              <a href="#" className="hover:text-indigo-600 transition-colors">Privacy</a>
              <a href="#" className="hover:text-indigo-600 transition-colors">Cookies</a>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
};

export default Home;
