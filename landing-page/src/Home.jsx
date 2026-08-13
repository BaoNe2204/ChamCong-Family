import React, { useState, useEffect } from 'react';
import { Phone, Menu, MapPin, Mail, ArrowRight, ShieldCheck, Factory, Truck, Star, Send, Moon, Sun, Globe, MessageCircle, CheckCircle, ChevronDown, ChevronUp, Award, Package, Users } from 'lucide-react';
import './index.css';

// 3D Interactive Product Viewer
const InteractiveViewer = () => {
  const [activeColor, setActiveColor] = React.useState(0);
  const [baseRotationY, setBaseRotationY] = React.useState(0);
  const [animating, setAnimating] = React.useState(false);

  const colors = [
    { name: 'Đỏ Truyền Thống', hex: '#dc2626', img: '/broom-0.png', badge: 'Bán chạy nhất', desc: 'Sắc đỏ mang lại may mắn, tông màu phổ biến nhất được các đại lý tin dùng.' },
    { name: 'Xanh Lá Tươi', hex: '#16a34a', img: '/broom-1.png', badge: 'Mới', desc: 'Màu xanh tươi mát, tạo cảm giác sạch sẽ, thân thiện với mọi không gian gia đình.' },
    { name: 'Vàng Chanh', hex: '#facc15', img: '/broom-2.png', badge: 'Nổi bật', desc: 'Tông vàng chanh rực rỡ, giúp dễ dàng nhận biết sản phẩm từ xa.' },
    { name: 'Xanh Đại Dương', hex: '#2563eb', img: '/broom-3.png', badge: 'Hiện đại', desc: 'Sắc xanh dương thanh lịch, hiện đại, thích hợp cho không gian sang trọng.' }
  ];

  const handleColorClick = (index) => {
    if (index === activeColor) return;
    setAnimating(true);
    setBaseRotationY(baseRotationY + 360);
    setTimeout(() => {
      setActiveColor(index);
      setAnimating(false);
    }, 400);
  };

  return (
    <div className="viewer-container" style={{
      display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px',
      alignItems: 'center', padding: '60px', background: 'var(--bg-card)', 
      borderRadius: '40px', boxShadow: '0 30px 60px rgba(0,0,0,0.05)', 
      margin: '20px 0 60px', border: '1px solid var(--glass-border)', position: 'relative', overflow: 'hidden'
    }}>
      
      {/* Cột Trái: Specs */}
      <div className="viewer-info" style={{zIndex: 2, paddingLeft: '20px'}}>
        <div style={{display: 'inline-block', padding: '6px 16px', background: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary)', borderRadius: '20px', fontWeight: 'bold', marginBottom: '15px', fontSize: '0.9rem'}}>
          {colors[activeColor].badge}
        </div>
        <h3 style={{fontSize: '2.5rem', marginBottom: '10px', color: 'var(--text-main)'}}>{colors[activeColor].name}</h3>
        <p style={{color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '30px', lineHeight: '1.6'}}>
          {colors[activeColor].desc}
        </p>
        
        <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            <CheckCircle size={20} color="var(--primary)"/> <span style={{fontWeight: 500}}>Chiều dài tiêu chuẩn: 1.2m</span>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            <CheckCircle size={20} color="var(--primary)"/> <span style={{fontWeight: 500}}>Chất liệu: Nhựa PP nguyên sinh</span>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            <CheckCircle size={20} color="var(--primary)"/> <span style={{fontWeight: 500}}>Khớp nối: Ren xoắn kép siêu chắc</span>
          </div>
        </div>
      </div>

      {/* Cột Giữa: Broom 3D */}
      <div className="viewer-stage" style={{
        perspective: '1500px', width: '100%', height: '500px',
        display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative',
        zIndex: 1
      }}>
        {/* Chữ chìm khổng lồ */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          fontSize: '6rem', fontWeight: 900, color: 'rgba(0,0,0,0.03)', whiteSpace: 'nowrap',
          pointerEvents: 'none', zIndex: -1, letterSpacing: '-2px'
        }}>
          THÚY KIỀU
        </div>

        {/* Ánh sáng nền mờ */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: '300px', height: '300px', background: colors[activeColor].hex,
          opacity: 0.15, filter: 'blur(80px)', transition: 'background 0.5s ease',
          borderRadius: '50%', pointerEvents: 'none'
        }}></div>
        
        {/* Cây chổi */}
        <div style={{
          width: '100%', height: '100%', position: 'absolute',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          transformStyle: 'preserve-3d',
        }}>
          <img 
            className="floating-broom"
            src={colors[activeColor].img} 
            alt="3D Broom" 
            style={{
              height: '95%', objectFit: 'contain', '--rx': '0deg', '--ry': `${baseRotationY}deg`,
              transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s',
              opacity: animating ? 0.5 : 1, filter: 'drop-shadow(20px 20px 30px rgba(0,0,0,0.15))'
            }} 
          />
        </div>
        
        {/* Bóng mờ dưới sàn */}
        <div style={{
          position: 'absolute', bottom: '10px', width: '200px', height: '20px',
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 70%)',
          borderRadius: '50%', filter: 'blur(4px)',
          transform: animating ? 'scale(0.5)' : 'scale(1)',
          transition: 'transform 0.4s ease',
          animation: 'shadow-pulse 4s ease-in-out infinite' 
        }}></div>
      </div>

      {/* Cột Phải: Action */}
      <div className="viewer-action" style={{zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
        <h4 style={{fontSize: '1.2rem', marginBottom: '20px', color: 'var(--text-muted)'}}>Chọn Màu Sắc</h4>
        <div style={{
          display: 'flex', gap: '20px',
          background: 'rgba(255,255,255,0.5)', padding: '15px 30px', borderRadius: '999px',
          boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.02), 0 10px 30px rgba(0,0,0,0.03)',
          marginBottom: '40px'
        }}>
          {colors.map((c, i) => (
            <button 
              key={i}
              onClick={() => handleColorClick(i)}
              style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: c.hex, border: 'none', cursor: 'pointer',
                boxShadow: activeColor === i ? `0 0 0 4px white, 0 0 0 8px ${c.hex}` : '0 4px 10px rgba(0,0,0,0.1)',
                transform: activeColor === i ? 'scale(1.1) translateY(-5px)' : 'scale(1)',
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
              title={c.name}
            />
          ))}
        </div>
        <a href="#contact" className="btn btn-primary glow-effect" style={{padding: '16px 40px', fontSize: '1.1rem'}}>
          Nhận Báo Giá Sỉ
        </a>
      </div>
    </div>
  );
};

const TypewriterText = ({ text }) => {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(interval);
    }, 150);
    return () => clearInterval(interval);
  }, [text]);
  
  return <span className="typewriter">{displayedText}</span>;
};

function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState('light');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeFaq, setActiveFaq] = useState(null);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      setScrollProgress((winScroll / height) * 100);
    };
    window.addEventListener('scroll', handleScroll);
    
    // Intersection Observer for Scroll Animations
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach((el) => {
      observer.observe(el);
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  // Interactive Ripple Effect
  const createRipple = (e) => {
    const button = e.currentTarget;
    const circle = document.createElement("span");
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${e.clientX - button.getBoundingClientRect().left - radius}px`;
    circle.style.top = `${e.clientY - button.getBoundingClientRect().top - radius}px`;
    circle.classList.add("ripple");
    
    const existingRipple = button.querySelector('.ripple');
    if (existingRipple) {
      existingRipple.remove();
    }
    button.appendChild(circle);
  };

  // 3D Tilt Effect
  const handleTilt = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const rx = ((y - cy) / cy) * -10;
    const ry = ((x - cx) / cx) * 10;
    card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.02, 1.02, 1.02)`;
    
    const glare = card.querySelector('.tilt-glare');
    if (glare) {
      glare.style.opacity = '1';
      glare.style.transform = `translate(${x - cx}px, ${y - cy}px)`;
    }
  };

  const handleTiltLeave = (e) => {
    const card = e.currentTarget;
    card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    const glare = card.querySelector('.tilt-glare');
    if (glare) {
      glare.style.opacity = '0';
    }
  };

  return (
    <>
      <div className="scroll-progress-container">
        <div className="scroll-progress-bar" style={{ width: `${scrollProgress}%` }}></div>
      </div>
      <div className="bg-mesh"></div>
      
      {/* Header */}
      <header className={`header ${scrolled ? 'scrolled' : ''}`}>
        <div className="container header-content">
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); window.scrollTo({top: 0, behavior: 'smooth'}); }} 
            className="logo" 
            style={{textDecoration: 'none', cursor: 'pointer'}}
          >
            <div style={{
              background: 'linear-gradient(135deg, var(--primary), #60a5fa)',
              padding: '8px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(37, 99, 235, 0.3)'
            }}>
              <Factory size={22} color="#ffffff" strokeWidth={2.5} />
            </div>
            <span style={{
              background: 'linear-gradient(to right, var(--primary), #3b82f6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 900,
              fontSize: '1.9rem',
              letterSpacing: '-1px'
            }}>Thúy Kiều</span>
          </a>
          <nav className="nav-links">
            <a href="#about">Về chúng tôi</a>
            <a href="#features">Ưu điểm</a>
            <a href="#products">Sản phẩm</a>
            <a href="#contact">Liên hệ</a>
          </nav>
          <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
            <button 
              onClick={toggleTheme} 
              style={{
                background: 'none', border: 'none', cursor: 'pointer', 
                color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '8px', borderRadius: '50%', background: 'var(--glass-border)'
              }}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero" style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Parallax Orbs */}
        <div className="bg-orb" style={{ top: '10%', left: '5%', width: '300px', height: '300px', background: 'var(--primary)', animationDelay: '0s' }}></div>
        <div className="bg-orb" style={{ top: '40%', right: '10%', width: '250px', height: '250px', background: '#ec4899', animationDelay: '-5s' }}></div>
        <div className="bg-orb" style={{ bottom: '10%', left: '20%', width: '400px', height: '400px', background: '#8b5cf6', animationDelay: '-10s' }}></div>

        <div className="container hero-grid" style={{ position: 'relative', zIndex: 1 }}>
          <div className="hero-text reveal">
            <h1>Sản xuất<br/> <TypewriterText text="Cán Chổi Nhựa" /><br/>Chuẩn Cao Cấp</h1>
            <p>
              Cơ sở Thúy Kiều tự hào là nhà cung cấp sỉ cán chổi nhựa uy tín với dây chuyền hiện đại. Chúng tôi mang đến sản phẩm độ bền tuyệt đối với mức giá xuất xưởng tốt nhất cho đối tác toàn quốc.
            </p>
            <div className="hero-actions">
              <a href="#products" className="btn btn-primary glow-effect ripple-btn" onClick={createRipple}>
                Xem Catalog <ArrowRight size={20} />
              </a>
              <a href="#contact" className="btn btn-outline ripple-btn" onClick={createRipple}>
                Tư vấn miễn phí
              </a>
            </div>
            
            <div className="stats reveal" style={{transitionDelay: '0.2s'}}>
              <div className="stat-item">
                <h4>10+</h4>
                <p>Năm kinh nghiệm</p>
              </div>
              <div className="stat-item">
                <h4>50k+</h4>
                <p>Sản phẩm mỗi tháng</p>
              </div>
              <div className="stat-item">
                <h4>100%</h4>
                <p>Nhựa nguyên sinh</p>
              </div>
            </div>
          </div>
          
          <div className="hero-image-wrapper reveal" style={{transitionDelay: '0.4s', position: 'relative', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            <div className="hero-card" style={{background: 'transparent', border: 'none', boxShadow: 'none', position: 'relative', width: '450px', height: '650px', marginTop: '-40px'}}>
              {/* Cây màu vàng - Xòe trái */}
              <img 
                src="/broom-2.png" 
                alt="Chổi vàng" 
                className="floating-broom"
                style={{position: 'absolute', top: 0, left: '-50px', height: '100%', objectFit: 'contain', filter: 'drop-shadow(30px 20px 40px rgba(0,0,0,0.15))', transform: 'rotate(-25deg) translateY(60px)', zIndex: 1, animationDelay: '0s'}}
              />
              {/* Cây màu xanh lá - Xòe hơi trái */}
              <img 
                src="/broom-1.png" 
                alt="Chổi xanh lá" 
                className="floating-broom"
                style={{position: 'absolute', top: 0, left: '30px', height: '100%', objectFit: 'contain', filter: 'drop-shadow(30px 20px 40px rgba(0,0,0,0.15))', transform: 'rotate(-10deg) translateY(15px)', zIndex: 2, animationDelay: '0.2s'}}
              />
              {/* Cây màu xanh dương - Xòe hơi phải */}
              <img 
                src="/broom-3.png" 
                alt="Chổi xanh dương" 
                className="floating-broom"
                style={{position: 'absolute', top: 0, left: '110px', height: '100%', objectFit: 'contain', filter: 'drop-shadow(30px 20px 40px rgba(0,0,0,0.15))', transform: 'rotate(5deg) translateY(15px)', zIndex: 3, animationDelay: '0.4s'}}
              />
              {/* Cây màu đỏ - Nằm trên cùng xòe phải */}
              <img 
                src="/broom-0.png" 
                alt="Chổi đỏ" 
                className="floating-broom"
                style={{position: 'absolute', top: 0, left: '190px', height: '100%', objectFit: 'contain', filter: 'drop-shadow(30px 20px 40px rgba(0,0,0,0.25))', transform: 'rotate(20deg) translateY(60px)', zIndex: 4, animationDelay: '0.6s'}}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Counter Banner */}
      <section className="stats-section reveal" style={{ padding: '20px 0 60px' }}>
        <div className="container">
          <div className="stats-glass-card">
            <div className="stat-item-modern">
              <Award className="stat-icon" size={36} />
              <div className="stat-number-modern">10+</div>
              <div className="stat-label-modern">Năm Kinh Nghiệm</div>
            </div>
            <div className="stat-item-modern">
              <Package className="stat-icon" size={36} />
              <div className="stat-number-modern">50k+</div>
              <div className="stat-label-modern">Sản Phẩm/Tháng</div>
            </div>
            <div className="stat-item-modern">
              <Users className="stat-icon" size={36} />
              <div className="stat-number-modern">100+</div>
              <div className="stat-label-modern">Đại Lý Sỉ Toàn Quốc</div>
            </div>
            <div className="stat-item-modern">
              <Star className="stat-icon" size={36} />
              <div className="stat-number-modern">100%</div>
              <div className="stat-label-modern">Nhựa Nguyên Sinh</div>
            </div>
          </div>
        </div>
      </section>

      {/* Infinite Marquee */}
      <div className="marquee-wrapper reveal">
        <div className="marquee-content">
          <span>✦ NHỰA NGUYÊN SINH 100%</span>
          <span>✦ ĐỘ BỀN VƯỢT TRỘI</span>
          <span>✦ GIÁ GỐC TẬN XƯỞNG</span>
          <span>✦ GIAO HÀNG TOÀN QUỐC</span>
          <span>✦ NHỰA NGUYÊN SINH 100%</span>
          <span>✦ ĐỘ BỀN VƯỢT TRỘI</span>
          <span>✦ GIÁ GỐC TẬN XƯỞNG</span>
          <span>✦ GIAO HÀNG TOÀN QUỐC</span>
        </div>
      </div>

      {/* About Us Section */}
      <section id="about" className="about" style={{ padding: '80px 0' }}>
        <div className="container">
          <div className="about-split">
            <div className="about-image reveal">
              <img src="/brooms.jpg" alt="Quy mô xưởng sản xuất" />
              <div style={{ position: 'absolute', bottom: '20px', left: '20px', background: 'rgba(255,255,255,0.9)', padding: '15px 25px', borderRadius: '15px', backdropFilter: 'blur(10px)', color: '#1e293b', fontWeight: 'bold' }}>
                <span style={{ fontSize: '2rem', color: 'var(--primary)' }}>10+</span> Năm Kinh Nghiệm
              </div>
            </div>
            <div className="about-text reveal" style={{ transitionDelay: '0.2s' }}>
              <h2 className="gradient-text">Về Cơ Sở Thúy Kiều</h2>
              <p style={{ fontSize: '1.2rem', marginBottom: '20px', color: 'var(--text-muted)' }}>Chúng tôi tự hào là xưởng sản xuất cán chổi nhựa quy mô lớn hàng đầu khu vực, cung cấp hàng triệu sản phẩm mỗi năm cho thị trường toàn quốc.</p>
              <ul className="about-list">
                <li><CheckCircle className="check-icon" /> Dây chuyền ép nhựa công nghệ cao hiện đại nhất</li>
                <li><CheckCircle className="check-icon" /> Sử dụng 100% hạt nhựa nguyên sinh, an toàn sức khỏe</li>
                <li><CheckCircle className="check-icon" /> Năng lực cung ứng linh hoạt cho mọi đơn hàng cực lớn</li>
                <li><CheckCircle className="check-icon" /> Chiết khấu tận xưởng, không qua bất kỳ trung gian nào</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Products */}
      <section id="products" className="products">
        <div className="container">
          <div className="section-header reveal">
            <h2 className="gradient-text">Danh Mục Sản Phẩm</h2>
            <p>Đa dạng kích thước, màu sắc và kiểu dáng, đáp ứng mọi nhu cầu của nhà sản xuất chổi và đại lý phân phối.</p>
          </div>

          <div className="reveal" style={{transitionDelay: '0.2s'}}>
            <InteractiveViewer />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="features">
        <div className="container">
          <div className="section-header reveal">
            <h2 className="gradient-text">Tại sao chọn Thúy Kiều?</h2>
            <p>Sự hài lòng của khách hàng là thước đo cho chất lượng của chúng tôi. Mỗi sản phẩm đều được kiểm định kỹ lưỡng trước khi xuất xưởng.</p>
          </div>
          
          <div className="features-grid">
            <div className="feature-card tilt-card reveal" style={{transitionDelay: '0.1s'}} onMouseMove={handleTilt} onMouseLeave={handleTiltLeave}>
              <div className="tilt-glare"></div>
              <div className="icon-box">
                <ShieldCheck size={40} />
              </div>
              <h3>Độ Bền Vượt Trội</h3>
              <p>Chất liệu nhựa dẻo dai, chịu va đập mạnh, chống lão hóa gãy đứt trong quá trình sử dụng lâu dài dưới mọi thời tiết.</p>
            </div>
            <div className="feature-card tilt-card reveal" style={{transitionDelay: '0.2s'}} onMouseMove={handleTilt} onMouseLeave={handleTiltLeave}>
              <div className="tilt-glare"></div>
              <div className="icon-box">
                <Star size={40} />
              </div>
              <h3>Thẩm Mỹ Cao</h3>
              <p>Thiết kế vân chống trượt tiện lợi, nhiều màu sắc tươi sáng, đều màu, không phai mờ theo thời gian.</p>
            </div>
            <div className="feature-card tilt-card reveal" style={{transitionDelay: '0.3s'}} onMouseMove={handleTilt} onMouseLeave={handleTiltLeave}>
              <div className="tilt-glare"></div>
              <div className="icon-box">
                <Truck size={40} />
              </div>
              <h3>Giá Gốc Tận Xưởng</h3>
              <p>Không qua trung gian. Cam kết mức chiết khấu cực tốt cho đại lý và nhà phân phối toàn quốc, hỗ trợ vận chuyển nhanh.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Process Timeline Section */}
      <section className="process" style={{ background: 'var(--bg-card)', padding: '80px 0' }}>
        <div className="container">
          <div className="section-header reveal">
            <h2 className="gradient-text">Quy Trình Hợp Tác Sỉ</h2>
            <p>Đơn giản, minh bạch và nhanh chóng. Chúng tôi luôn tối ưu để đối tác nhận hàng sớm nhất.</p>
          </div>
          <div className="process-grid reveal" style={{ transitionDelay: '0.2s' }}>
            <div className="process-step">
              <div className="step-number">1</div>
              <h3>Tư Vấn & Báo Giá</h3>
              <p>Liên hệ hotline/zalo để nhận bảng giá sỉ siêu rẻ theo số lượng chi tiết.</p>
            </div>
            <div className="process-step">
              <div className="step-number">2</div>
              <h3>Chốt Mẫu & Đặt Cọc</h3>
              <p>Lựa chọn kích thước, màu sắc và tiến hành làm hợp đồng, đặt cọc đơn hàng.</p>
            </div>
            <div className="process-step">
              <div className="step-number">3</div>
              <h3>Sản Xuất & Kiểm Định</h3>
              <p>Đưa vào dây chuyền ép phun, kiểm tra chất lượng từng sản phẩm trước khi đóng bao.</p>
            </div>
            <div className="process-step">
              <div className="step-number">4</div>
              <h3>Giao Hàng Tận Nơi</h3>
              <p>Hỗ trợ vận chuyển ra chành xe hoặc giao tận kho khách hàng trên toàn quốc.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" style={{ padding: '80px 0' }}>
        <div className="container">
          <div className="section-header reveal">
            <h2 className="gradient-text">Câu Hỏi Thường Gặp</h2>
            <p>Tổng hợp những thắc mắc phổ biến nhất từ các đối tác sỉ của Thúy Kiều.</p>
          </div>
          <div className="faq-list reveal" style={{ transitionDelay: '0.2s' }}>
            {[
              { q: 'Số lượng lấy sỉ tối thiểu (MOQ) là bao nhiêu?', a: 'Chúng tôi hỗ trợ lấy sỉ từ 1000 sản phẩm. Với số lượng càng lớn, mức chiết khấu càng cao.' },
              { q: 'Có nhận gia công màu cán chổi theo yêu cầu không?', a: 'Có. Nếu đơn hàng đạt số lượng tối thiểu, chúng tôi sẵn sàng phối màu hạt nhựa chuẩn theo yêu cầu nhận diện thương hiệu của quý khách.' },
              { q: 'Chính sách vận chuyển đi các tỉnh như thế nào?', a: 'Xưởng sẽ hỗ trợ bốc xếp và vận chuyển miễn phí ra các chành xe tại khu vực. Quý khách thanh toán cước chành xe hoặc chúng tôi sẽ báo trọn gói bao gồm cước.' },
              { q: 'Sản phẩm có bị gãy nứt khi thời tiết lạnh không?', a: 'Tuyệt đối không. Cán chổi Thúy Kiều sử dụng nhựa nguyên sinh cao cấp có tính đàn hồi tốt, chịu được mọi loại thời tiết khắc nghiệt mà không bị giòn gãy.' }
            ].map((faq, index) => (
              <div key={index} className={`faq-item ${activeFaq === index ? 'active' : ''}`}>
                <button className="faq-question" onClick={() => toggleFaq(index)}>
                  {faq.q}
                  {activeFaq === index ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
                <div className="faq-answer">
                  <p>{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact">
        <div className="container">
          <div className="section-header reveal" style={{textAlign: 'center', marginBottom: '40px'}}>
            <h2 className="gradient-text">Liên Hệ Trực Tiếp</h2>
            <p>Chọn phương thức liên lạc tiện lợi nhất cho bạn để nhận ngay báo giá sỉ cực sốc.</p>
          </div>

          <div className="contact-grid reveal" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '50px' }}>
            <a href="tel:0905123456" className="contact-btn ripple-btn phone" onClick={createRipple}>
              <div className="icon-circle">
                <Phone size={36} />
              </div>
              <h3>Gọi Điện Thoại</h3>
              <span>0905 123 456</span>
            </a>

            <a href="https://zalo.me/0905123456" target="_blank" rel="noreferrer" className="contact-btn ripple-btn zalo" onClick={createRipple}>
              <div className="icon-circle">
                <MessageCircle size={36} />
              </div>
              <h3>Chat Zalo</h3>
              <span>0905 123 456</span>
            </a>

            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="contact-btn ripple-btn fb" onClick={createRipple}>
              <div className="icon-circle">
                <Globe size={36} />
              </div>
              <h3>Facebook</h3>
              <span>Cơ Sở Thúy Kiều</span>
            </a>

            <a href="mailto:lienhe@choinhuathuykieu.com" className="contact-btn ripple-btn mail" onClick={createRipple}>
              <div className="icon-circle">
                <Mail size={36} />
              </div>
              <h3>Gửi Email</h3>
              <span>lienhe@...</span>
            </a>
          </div>

          {/* Bản đồ Google Maps - Custom Overlay */}
          <div className="reveal" style={{ position: 'relative', borderRadius: '40px', overflow: 'hidden', height: '450px', boxShadow: '0 20px 50px rgba(0,0,0,0.08)' }}>
            <iframe 
              title="Bản đồ Khu vực"
              src="https://maps.google.com/maps?q=Trà+Câu,+Đức+Phổ,+Quảng+Ngãi,+Việt+Nam&t=&z=14&ie=UTF8&iwloc=&output=embed" 
              width="100%" 
              height="100%" 
              style={{ border: 0, filter: 'contrast(1.1) grayscale(0.2)' }} 
              allowFullScreen="" 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade">
            </iframe>
            
            {/* Custom Info Card Overlay */}
            <div className="map-overlay-card" style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'rgba(255, 255, 255, 0.95)',
              padding: '30px',
              borderRadius: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              backdropFilter: 'blur(10px)',
              width: '90%',
              maxWidth: '400px',
              textAlign: 'center',
              border: '1px solid rgba(255,255,255,0.5)'
            }}>
              <div style={{ background: 'var(--primary)', color: 'white', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px', boxShadow: '0 10px 20px rgba(37, 99, 235, 0.3)' }}>
                <MapPin size={24} />
              </div>
              <h3 style={{ fontSize: '1.4rem', color: '#1e293b', marginBottom: '10px', fontWeight: 800 }}>Cơ Sở Thúy Kiều</h3>
              <p style={{ color: '#64748b', fontSize: '1rem', marginBottom: '20px', lineHeight: '1.5' }}>
                <strong>Mã vị trí:</strong> VW9H+C4J<br/>
                Trà Câu, Đức Phổ, Quảng Ngãi, Việt Nam
              </p>
              <a 
                href="https://www.google.com/maps/search/?api=1&query=VW9H%2BC4J,+Tr%C3%A0+C%C3%A2u,+Qu%E1%BA%A3ng+Ng%C3%A3i,+Vi%E1%BB%87t+Nam" 
                target="_blank" 
                rel="noreferrer"
                className="btn btn-primary glow-effect ripple-btn" 
                style={{ width: '100%', padding: '12px', fontSize: '1rem', display: 'flex', justifyContent: 'center' }}
                onClick={createRipple}
              >
                Mở Bản Đồ Chỉ Đường
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="modern-footer">
        <div className="container">
          <div className="footer-grid reveal">
            {/* Column 1: Logo & Desc */}
            <div className="footer-col brand-col">
              <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="logo" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: 'linear-gradient(135deg, var(--primary), #60a5fa)', padding: '8px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(37, 99, 235, 0.3)' }}>
                  <Factory size={22} color="#ffffff" strokeWidth={2.5} />
                </div>
                <span style={{ background: 'linear-gradient(to right, var(--primary), #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 900, fontSize: '1.9rem', letterSpacing: '-1px' }}>Thúy Kiều</span>
              </a>
              <p className="footer-desc">Đơn vị chuyên sản xuất và phân phối sỉ cán chổi nhựa nguyên sinh 100% lớn nhất khu vực. Uy tín tạo nên thương hiệu.</p>
              <div className="social-links">
                <a href="https://facebook.com" target="_blank" rel="noreferrer"><Globe size={20}/></a>
                <a href="https://zalo.me/0905123456" target="_blank" rel="noreferrer"><MessageCircle size={20}/></a>
                <a href="mailto:lienhe@choinhuathuykieu.com"><Mail size={20}/></a>
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div className="footer-col">
              <h3>Liên Kết Nhanh</h3>
              <ul>
                <li><a href="#about">Về Chúng Tôi</a></li>
                <li><a href="#products">Sản Phẩm</a></li>
                <li><a href="#features">Quy Trình Hợp Tác</a></li>
                <li><a href="#faq">Câu Hỏi Thường Gặp</a></li>
              </ul>
            </div>

            {/* Column 3: Contact Info */}
            <div className="footer-col">
              <h3>Thông Tin Liên Hệ</h3>
              <ul className="contact-info-list">
                <li><MapPin size={18} className="info-icon" /> <span>Trà Câu, Đức Phổ, Quảng Ngãi</span></li>
                <li><Phone size={18} className="info-icon" /> <span>0905 123 456 (Zalo Chăm Sóc Sỉ)</span></li>
                <li><Mail size={18} className="info-icon" /> <span>lienhe@choinhuathuykieu.com</span></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} Cán Chổi Nhựa Thúy Kiều. Tất cả quyền được bảo lưu.</p>
            <div className="dev-credit">
              Designed & Developed with ❤️ by <strong>Gia Bảo (BaoNe2204)</strong>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

export default Home;
