import ComparisonPage from './comparison-page';
import { RecorderOverview } from '../components/recorder-overview';
import { recorders } from '../lib/recorders';
import { siteDescription, siteTitle, siteUrl } from '../lib/site-metadata';

export default function Home() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebSite', '@id': `${siteUrl}#website`, url: siteUrl.href, name: 'Recorder Select', description: siteDescription },
      { '@type': 'CollectionPage', '@id': `${siteUrl}#webpage`, url: siteUrl.href, name: siteTitle, description: siteDescription,
        isPartOf: { '@id': `${siteUrl}#website` }, mainEntity: { '@id': `${siteUrl}#recorders` } },
      { '@type': 'ItemList', '@id': `${siteUrl}#recorders`, name: 'Screen recording software',
        itemListOrder: 'https://schema.org/ItemListUnordered', numberOfItems: recorders.length,
        itemListElement: recorders.map((recorder, index) => ({ '@type': 'ListItem', position: index + 1,
          item: { '@type': 'SoftwareApplication', name: recorder.name, url: recorder.website,
            applicationCategory: 'MultimediaApplication',
            operatingSystem: recorder.platforms?.map(platform => ({ mac: 'macOS', win: 'Windows', linux: 'Linux' })[platform]).join(', ') } })) },
    ],
  };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
    <ComparisonPage overview={<RecorderOverview />} />
  </>;
}
