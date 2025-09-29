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
    { name: 'LinkedIn', url: 'https://linkedin.com/in/fullstackjam-ma-a817b5239/', icon: 'fab fa-linkedin' },
    { name: 'Twitter', url: 'https://twitter.com/fullstackjam', icon: 'fab fa-twitter' },
    { name: 'Email', url: 'mailto:fullstackjam@outlook.com', icon: 'fas fa-envelope' }
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
      name: 'Portfolio Website',
      description: 'A modern, responsive portfolio website built with Angular showcasing projects, skills, and experience.',
      technologies: ['Angular', 'TypeScript', 'CSS3', 'Responsive Design'],
      github: 'https://github.com/fullstackjam/portfolio',
      demo: 'https://portfolio.fullstackjam.com'
    },
    {
      name: 'Blog Platform',
      description: 'A full-stack blog platform with content management, user authentication, and modern web technologies.',
      technologies: ['Next.js', 'React', 'Node.js', 'PostgreSQL', 'Tailwind CSS'],
      github: 'https://github.com/fullstackjam/blog',
      demo: 'https://blog.fullstackjam.com'
    },
    {
      name: 'K8s GitOps Infrastructure',
      description: 'Kubernetes GitOps infrastructure with monitoring, uptime tracking, and automated deployments.',
      technologies: ['Kubernetes', 'ArgoCD', 'Uptime Kuma', 'Docker', 'GitOps'],
      github: 'https://github.com//k8s-gitops',
      demo: 'https://uptime-kuma.fullstackjam.com'
    }
  ];

  contact = {
    message: 'Interested in working together? I\'m always open to discussing new opportunities and exciting projects!',
    email: 'fullstackjam@outlook.com',
    linkedin: 'https://linkedin.com/in/jam-ma-a817b5239/'
  };
}
