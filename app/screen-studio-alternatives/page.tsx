import { AlternativeGuide } from '../../components/alternative-guide';
import { alternativeMetadata } from '../../lib/alternative-guide';

export const metadata = alternativeMetadata('en');
export default function Page() { return <AlternativeGuide language="en" />; }
