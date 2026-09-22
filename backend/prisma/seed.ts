import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedService(
  name: string,
  description: string,
  widgets: Array<{
    name: string;
    description: string;
    parameters: Array<{ name: string; type: string }>;
  }>,
): Promise<void> {
  // Les services sont créés une seule fois et leurs widgets sont idempotents.
  const service = await prisma.service.upsert({
    where: { name },
    update: { description },
    create: { name, description },
  });

  for (const widget of widgets) {
    const savedWidget = await prisma.widget.upsert({
      where: { serviceId_name: { serviceId: service.id, name: widget.name } },
      update: { description: widget.description },
      create: {
        serviceId: service.id,
        name: widget.name,
        description: widget.description,
      },
    });

    for (const parameter of widget.parameters) {
      await prisma.widgetParameter.upsert({
        where: {
          widgetId_name: { widgetId: savedWidget.id, name: parameter.name },
        },
        update: { type: parameter.type },
        create: { widgetId: savedWidget.id, ...parameter },
      });
    }
  }
}

async function main(): Promise<void> {
  await seedService('weather', 'Weather information', [
    {
      name: 'city_temperature',
      description: 'Display the current temperature for a city',
      parameters: [{ name: 'city', type: 'string' }],
    },
    {
      name: 'city_forecast',
      description: 'Display the forecast for a city',
      parameters: [{ name: 'city', type: 'string' }],
    },
  ]);

  await seedService('rss', 'RSS feed information', [
    {
      name: 'article_list',
      description: 'Display the latest articles from a feed',
      parameters: [
        { name: 'link', type: 'string' },
        { name: 'number', type: 'integer' },
      ],
    },
  ]);

  await seedService('github', 'GitHub repository information', [
    {
      name: 'recent_commits',
      description: 'Display recent commits from a repository',
      parameters: [
        { name: 'repository', type: 'string' },
        { name: 'number', type: 'integer' },
      ],
    },
  ]);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
