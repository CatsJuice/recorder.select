import { AlternativeGuide } from '../../../components/alternative-guide';
import { alternativeMetadata } from '../../../lib/alternative-guide';

export const metadata = alternativeMetadata('zh-CN');
export default function Page() { return <AlternativeGuide language="zh-CN" />; }
