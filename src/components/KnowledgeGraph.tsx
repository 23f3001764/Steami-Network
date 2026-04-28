import { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useThemeStore } from '@/stores/theme-store';

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  lightColor: string;
  isCenter?: boolean;
}

interface Edge {
  from: string;
  to: string;
}

interface KnowledgeGraphProps {
  centerTopic: string;
  relatedTopics: string[];
  field: string;
  compact?: boolean;
}

export function KnowledgeGraph({ centerTopic, relatedTopics, field, compact = false }: KnowledgeGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<Edge[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const isLight = useThemeStore((s) => s.theme === 'light');

  const width = compact ? 220 : 320;
  const height = compact ? 160 : 220;

  useEffect(() => {
    const cx = width / 2;
    const cy = height / 2;
    const topics = [field, ...relatedTopics].slice(0, 7);

    const nodes: Node[] = [
      { id: 'center', label: centerTopic.length > 20 ? centerTopic.slice(0, 18) + '…' : centerTopic, x: cx, y: cy, vx: 0, vy: 0, radius: compact ? 6 : 8, color: 'hsl(42, 75%, 60%)', lightColor: 'hsl(42, 75%, 42%)', isCenter: true },
    ];

    const edges: Edge[] = [];
    const angleStep = (2 * Math.PI) / topics.length;
    const orbitR = compact ? 55 : 80;

    topics.forEach((topic, i) => {
      const angle = angleStep * i - Math.PI / 2;
      nodes.push({
        id: `t${i}`,
        label: topic.length > 14 ? topic.slice(0, 12) + '…' : topic,
        x: cx + Math.cos(angle) * orbitR + (Math.random() - 0.5) * 10,
        y: cy + Math.sin(angle) * orbitR + (Math.random() - 0.5) * 10,
        vx: 0, vy: 0,
        radius: compact ? 4 : 5,
        color: i === 0 ? 'hsl(42, 75%, 60%)' : 'hsl(207, 72%, 65%)',
        lightColor: i === 0 ? 'hsl(42, 75%, 42%)' : 'hsl(210, 100%, 42%)',
      });
      edges.push({ from: 'center', to: `t${i}` });
      if (i > 0) edges.push({ from: `t${i - 1}`, to: `t${i}` });
    });

    nodesRef.current = nodes;
    edgesRef.current = edges;
  }, [centerTopic, relatedTopics, field, width, height, compact]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const nodes = nodesRef.current;
    const edges = edgesRef.current;
    const mx = mouseRef.current.x;
    const my = mouseRef.current.y;
    const light = isLight;

    // Simple force simulation
    for (const node of nodes) {
      if (node.isCenter) continue;
      const cx = width / 2;
      const cy = height / 2;
      const dx = cx - node.x;
      const dy = cy - node.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const targetDist = compact ? 55 : 80;
      const force = (dist - targetDist) * 0.002;
      node.vx += dx / dist * force;
      node.vy += dy / dist * force;

      const mdx = node.x - mx;
      const mdy = node.y - my;
      const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
      if (mDist < 40 && mDist > 0) {
        node.vx += mdx / mDist * 0.3;
        node.vy += mdy / mDist * 0.3;
      }

      node.vx += Math.sin(Date.now() * 0.001 + nodes.indexOf(node)) * 0.02;
      node.vy += Math.cos(Date.now() * 0.0012 + nodes.indexOf(node)) * 0.02;

      node.vx *= 0.92;
      node.vy *= 0.92;
      node.x += node.vx;
      node.y += node.vy;
      node.x = Math.max(node.radius + 20, Math.min(width - node.radius - 20, node.x));
      node.y = Math.max(node.radius + 10, Math.min(height - node.radius - 10, node.y));
    }

    // Draw edges
    for (const edge of edges) {
      const from = nodes.find(n => n.id === edge.from);
      const to = nodes.find(n => n.id === edge.to);
      if (!from || !to) continue;
      const isHov = hoveredNode === from.id || hoveredNode === to.id;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      if (light) {
        ctx.strokeStyle = isHov ? 'rgba(0, 92, 194, 0.45)' : 'rgba(0, 92, 194, 0.18)';
      } else {
        ctx.strokeStyle = isHov ? 'rgba(99, 179, 237, 0.5)' : 'rgba(99, 179, 237, 0.15)';
      }
      ctx.lineWidth = isHov ? 1.5 : 0.8;
      ctx.stroke();
    }

    // Draw nodes
    let newHovered: string | null = null;
    for (const node of nodes) {
      const dx = mx - node.x;
      const dy = my - node.y;
      const isHov = Math.sqrt(dx * dx + dy * dy) < node.radius + 8;
      if (isHov) newHovered = node.id;

      // Glow
      if (isHov || node.isCenter) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + 6, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.radius + 6);
        if (light) {
          grad.addColorStop(0, node.isCenter ? 'rgba(138, 112, 32, 0.2)' : 'rgba(0, 92, 194, 0.2)');
        } else {
          grad.addColorStop(0, node.isCenter ? 'rgba(232, 184, 75, 0.25)' : 'rgba(99, 179, 237, 0.25)');
        }
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fillStyle = light ? node.lightColor : node.color;
      ctx.fill();

      // Label
      ctx.font = `${compact ? 7 : 8}px 'IBM Plex Mono', monospace`;
      if (light) {
        ctx.fillStyle = isHov ? 'rgba(30, 41, 59, 1)' : 'rgba(30, 41, 59, 0.7)';
      } else {
        ctx.fillStyle = isHov ? 'rgba(214, 232, 248, 1)' : 'rgba(214, 232, 248, 0.7)';
      }
      ctx.textAlign = 'center';
      ctx.fillText(node.label, node.x, node.y + node.radius + (compact ? 10 : 13));
    }
    if (newHovered !== hoveredNode) setHoveredNode(newHovered);

    animRef.current = requestAnimationFrame(draw);
  }, [width, height, compact, hoveredNode, isLight]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="rounded-xl overflow-hidden"
      style={{
        background: isLight ? 'rgba(240, 249, 255, 0.6)' : 'rgba(6, 16, 38, 0.4)',
        border: isLight ? '1px solid rgba(96, 165, 250, 0.25)' : '1px solid rgba(99, 179, 237, 0.14)',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ width, height, cursor: hoveredNode ? 'pointer' : 'default' }}
        onMouseMove={handleMouseMove}
      />
    </motion.div>
  );
}