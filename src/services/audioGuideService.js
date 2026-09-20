/**
 * audioGuideService.js
 * Generates museum-grade curator narrations for artworks, detailing brushwork,
 * atmospheric mood, lighting theory, and artist intent.
 */

function generateCuratorNarrative(artwork) {
  const {
    title = 'Untitled Masterpiece',
    artistName = 'the artist',
    category = 'visual art',
    style = 'contemporary',
    mood = 'contemplative',
    description = '',
    colorPalette = [],
  } = artwork;

  const colorHighlights = colorPalette && colorPalette.length > 0
    ? `The palette commands attention through an interplay of ${colorPalette.slice(0, 3).join(', ')}, orchestrating both subtle tension and harmonious balance.`
    : 'The tonal graduation creates an alluring rhythm of depth and shadow.';

  const paragraphs = [
    `Welcome to the ArtHub Audio Gallery. Before you stands "${title}", an extraordinary work of ${style.toLowerCase()} ${category.toLowerCase()} by ${artistName}.`,
    `Notice how the artist explores an emotional landscape steeped in a ${mood.toLowerCase()} atmosphere. ${description ? description : 'Every stroke invites the viewer into a sanctuary of quiet introspection.'}`,
    `${colorHighlights} The texture commands presence, drawing the eye across the canvas with intentional kinetic energy.`,
    `As you linger with "${title}", consider the boundary between digital precision and human soul. ${artistName} invites you not merely to observe, but to enter into dialogue with the canvas.`
  ];

  return {
    artworkId: artwork._id,
    title,
    artistName,
    fullText: paragraphs.join('\n\n'),
    durationSeconds: Math.round(paragraphs.join(' ').split(' ').length / 2.3), // ~130 words per minute
    sections: [
      { id: 1, title: 'Introduction & Genesis', text: paragraphs[0] },
      { id: 2, title: 'Emotional Anatomy', text: paragraphs[1] },
      { id: 3, title: 'Color Theory & Technique', text: paragraphs[2] },
      { id: 4, title: 'Curator Reflection', text: paragraphs[3] },
    ],
  };
}

module.exports = {
  generateCuratorNarrative,
};
