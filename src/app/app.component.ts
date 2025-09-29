import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'portfolio';
  githubUsername = 'fullstackjam';

  profile = {
    name: 'Full Stack Developer',
    title: 'Software Engineer & Tech Enthusiast',
    location: '🌍 Remote',
    badges: ['Available for work', 'Open to collaboration']
  };

  socialLinks = [
    { name: 'GitHub', url: 'https://github.com/fullstackjam', icon: 'fab fa-github' },
    { name: 'LinkedIn', url: 'https://linkedin.com/in/fullstackjam', icon: 'fab fa-linkedin' },
    { name: 'Twitter', url: 'https://twitter.com/fullstackjam', icon: 'fab fa-twitter' },
    { name: 'Email', url: 'mailto:contact@fullstackjam.dev', icon: 'fas fa-envelope' }
  ];

  about = {
    description: 'Passionate full-stack developer with expertise in modern web technologies. I love building scalable applications, contributing to open source, and sharing knowledge with the developer community.',
    stats: [
      { value: '5+', label: 'Years Experience' },
      { value: '50+', label: 'Projects Completed' },
      { value: '100+', label: 'GitHub Repositories' },
      { value: '10+', label: 'Technologies Mastered' }
    ]
  };

  skills = [
    {
      name: 'Frontend',
      items: ['Angular', 'React', 'Vue.js', 'TypeScript', 'JavaScript', 'HTML5', 'CSS3', 'Sass', 'Tailwind CSS']
    },
    {
      name: 'Backend',
      items: ['Node.js', 'Python', 'Java', 'Spring Boot', 'Express.js', 'FastAPI', 'REST APIs', 'GraphQL']
    },
    {
      name: 'Database',
      items: ['PostgreSQL', 'MongoDB', 'Redis', 'MySQL', 'Firebase', 'Supabase']
    },
    {
      name: 'DevOps & Tools',
      items: ['Docker', 'Kubernetes', 'AWS', 'Git', 'CI/CD', 'Jenkins', 'GitHub Actions', 'Linux']
    }
  ];

  projects = [
    {
      name: 'E-Commerce Platform',
      description: 'A full-stack e-commerce solution with real-time inventory management, payment processing, and admin dashboard.',
      technologies: ['Angular', 'Node.js', 'PostgreSQL', 'Stripe API', 'Docker'],
      github: 'https://github.com/fullstackjam/ecommerce-platform',
      demo: 'https://ecommerce-demo.fullstackjam.dev'
    },
    {
      name: 'Task Management App',
      description: 'Collaborative task management tool with real-time updates, team collaboration features, and project tracking.',
      technologies: ['React', 'Express.js', 'MongoDB', 'Socket.io', 'Material-UI'],
      github: 'https://github.com/fullstackjam/task-manager',
      demo: 'https://tasks.fullstackjam.dev'
    },
    {
      name: 'Weather Dashboard',
      description: 'Real-time weather monitoring dashboard with data visualization, location-based forecasts, and historical data.',
      technologies: ['Vue.js', 'Python', 'FastAPI', 'Chart.js', 'OpenWeather API'],
      github: 'https://github.com/fullstackjam/weather-dashboard',
      demo: 'https://weather.fullstackjam.dev'
    }
  ];

  contact = {
    message: 'Interested in working together? I\'m always open to discussing new opportunities and exciting projects!',
    email: 'contact@fullstackjam.dev',
    linkedin: 'https://linkedin.com/in/fullstackjam'
  };
}
