
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { SiteConfig } from "@shared/schema";

interface FaqSectionTextsFormProps {
  configs: SiteConfig[];
}

const faqTextsSchema = z.object({
  badge: z.string().min(1, "Badge é obrigatório"),
  title: z.string().min(1, "Título é obrigatório"),
  subtitle: z.string().min(1, "Subtítulo é obrigatório"),
  description: z.string().optional(),
});

type FaqTextsForm = z.infer<typeof faqTextsSchema>;

export function FaqSectionTextsForm({ configs }: FaqSectionTextsFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const getConfigValue = (key: string) => {
    const config = configs.find(c => c.key === key);
    return config ? config.value : {};
  };

  const faqTexts = getConfigValue('faq_section') as any;

  const form = useForm<FaqTextsForm>({
    resolver: zodResolver(faqTextsSchema),
    defaultValues: {
      badge: faqTexts.badge || "PERGUNTAS FREQUENTES",
      title: faqTexts.title || "Respondemos suas (principais dúvidas)",
      subtitle: faqTexts.subtitle || "Encontre respostas para as principais questões sobre o atendimento",
      description: faqTexts.description || "",
    },
  });

  React.useEffect(() => {
    if (faqTexts && Object.keys(faqTexts).length > 0) {
      form.reset({
        badge: faqTexts.badge || "PERGUNTAS FREQUENTES",
        title: faqTexts.title || "Respondemos suas (principais dúvidas)",
        subtitle: faqTexts.subtitle || "Encontre respostas para as principais questões sobre o atendimento",
        description: faqTexts.description || "",
      });
    }
  }, [faqTextss, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: FaqTextsForm) => {
      const response = await apiRequest("POST", "/api/admin/config", {
        key: "faq_section",
        value: data
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/config"] });
      toast({ title: "Textos da seção FAQ atualizados com sucesso!" });
    },
  });

  const onSubmit = (data: FaqTextsForm) => {
    updateMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="subtitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subtítulo (Badge)</FormLabel>
              <FormControl>
                <Input placeholder="PERGUNTAS FREQUENTES" {...field} />
              </FormControl>
              <div className="text-xs text-muted-foreground">
                Texto pequeno que aparece acima do título principal
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título Principal ()</FormLabel>
              <FormControl>
                <Input placeholder="Respondemos suas (principais dúvidas)" {...field} />
              </FormControl>
              <div className="text-xs text-muted-foreground">
                Use () para destacar palavras com gradiente. Ex: (palavra) ficará colorida
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição (Opcional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Encontre respostas para as principais questões sobre o atendimento" 
                  rows={3} 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending ? "Salvando..." : "Salvar Textos"}
        </Button>
      </form>
    </Form>
  );
}
