import { lucide } from './Icon';
import { IconTile, type TileSize, type Tone } from './IconTile';

/** An icon tile for an icon name saved in the admin (server components only). */
export function NamedIconTile({ icon, ...props }: { icon: string | null | undefined; tone?: Tone | string; size?: TileSize; stroke?: number; className?: string }) {
    return <IconTile icon={lucide(icon)} {...props} />;
}
