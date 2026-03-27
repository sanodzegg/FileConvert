import type { DrawCommand, Point } from '../layers/use-draw-commands'
import type { ScaleInfo } from './image-space'
import { imageToCanvas } from './image-space'

export function translatePoint(p: Point, dx: number, dy: number): Point {
  return { x: p.x + dx, y: p.y + dy }
}

export function translateCommand(cmd: DrawCommand, dx: number, dy: number): DrawCommand {
  if (cmd.type === 'path') return { ...cmd, points: cmd.points.map(p => translatePoint(p, dx, dy)) }
  if (cmd.type === 'arrow') return { ...cmd, from: translatePoint(cmd.from, dx, dy), to: translatePoint(cmd.to, dx, dy) }
  return { ...cmd, x: cmd.x + dx, y: cmd.y + dy }
}

export function scaleCommand(cmd: DrawCommand, scale: ScaleInfo): DrawCommand {
  const sp = (p: Point) => imageToCanvas(p.x, p.y, scale)
  if (cmd.type === 'path') return { ...cmd, points: cmd.points.map(sp), width: cmd.width * scale.x }
  if (cmd.type === 'arrow') return { ...cmd, from: sp(cmd.from), to: sp(cmd.to), width: cmd.width * scale.x }
  const origin = sp({ x: cmd.x, y: cmd.y })
  return { ...cmd, x: origin.x, y: origin.y, w: cmd.w * scale.x, h: cmd.h * scale.y, width: cmd.width * scale.x }
}
