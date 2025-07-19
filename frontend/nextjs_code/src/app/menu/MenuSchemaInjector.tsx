type Props = {
  schema: Record<string, any>;
};

export default function MenuSchemaInjector({ schema }: Props) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
