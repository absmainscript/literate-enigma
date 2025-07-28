
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus, GripVertical, Star } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Testimonial } from "@shared/schema";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TestimonialsManagerProps {
  testimonials: Testimonial[];
}

const testimonialSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  service: z.string().min(1, "Serviço é obrigatório"),
  text: z.string().min(1, "Depoimento é obrigatório"),
  avatar: z.string().min(1, "Avatar é obrigatório"),
  rating: z.number().min(1).max(5),
  isActive: z.boolean(),
  order: z.number().min(0),
});

type TestimonialForm = z.infer<typeof testimonialSchema>;

export function TestimonialsManager({ testimonials }: TestimonialsManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const form = useForm<TestimonialForm>({
    resolver: zodResolver(testimonialSchema),
    defaultValues: {
      name: "",
      service: "",
      text: "",
      avatar: "avatar1",
      rating: 5,
      isActive: true,
      order: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: TestimonialForm) => {
      const response = await apiRequest("POST", "/api/admin/testimonials", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/testimonials"] });
      toast({ title: "Depoimento criado com sucesso!" });
      setIsDialogOpen(false);
      form.reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<TestimonialForm> }) => {
      const response = await apiRequest("PUT", `/api/admin/testimonials/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/testimonials"] });
      toast({ title: "Depoimento atualizado com sucesso!" });
      setEditingTestimonial(null);
      setIsDialogOpen(false);
      form.reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/admin/testimonials/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/testimonials"] });
      toast({ title: "Depoimento excluído com sucesso!" });
    },
  });

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over?.id && over) {
      const oldIndex = testimonials.findIndex((item) => item.id === active.id);
      const newIndex = testimonials.findIndex((item) => item.id === over.id);
      
      const reorderedTestimonials = arrayMove(testimonials, oldIndex, newIndex);
      
      const updatePromises = reorderedTestimonials.map((item, index) => 
        apiRequest("PUT", `/api/admin/testimonials/${item.id}`, { 
          order: index
        })
      );
      
      Promise.all(updatePromises).then(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/admin/testimonials"] });
        toast({ title: "Ordem dos depoimentos atualizada!" });
      }).catch(() => {
        toast({ title: "Erro ao atualizar ordem", variant: "destructive" });
      });
    }
  };

  const onSubmit = (data: TestimonialForm) => {
    if (editingTestimonial) {
      updateMutation.mutate({ id: editingTestimonial.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditDialog = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial);
    
    setTimeout(() => {
      form.setValue("name", testimonial.name || "");
      form.setValue("service", testimonial.service || "");
      form.setValue("text", testimonial.text || "");
      form.setValue("avatar", testimonial.avatar || "avatar1");
      form.setValue("rating", testimonial.rating || 5);
      form.setValue("isActive", testimonial.isActive ?? true);
      form.setValue("order", testimonial.order || 0);
    }, 100);
    
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingTestimonial(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const avatarOptions = [
    { value: "avatar1", label: "👤 Avatar Padrão", emoji: "👤" },
    { value: "avatar2", label: "👩 Mulher Jovem", emoji: "👩" },
    { value: "avatar3", label: "👨 Homem Jovem", emoji: "👨" },
    { value: "avatar4", label: "👵 Mulher Idosa", emoji: "👵" },
    { value: "avatar5", label: "👴 Homem Idoso", emoji: "👴" },
    { value: "avatar6", label: "👧 Adolescente", emoji: "👧" },
    { value: "avatar7", label: "👦 Garoto", emoji: "👦" },
    { value: "avatar8", label: "👪 Família", emoji: "👪" },
    { value: "avatar9", label: "👫 Casal", emoji: "👫" },
    { value: "avatar10", label: "🤰 Gestante", emoji: "🤰" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Gerenciar Depoimentos</h3>
          <p className="text-sm text-muted-foreground">
            Adicione, edite e organize os depoimentos dos seus pacientes
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Depoimento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTestimonial ? "Editar Depoimento" : "Novo Depoimento"}
              </DialogTitle>
              <DialogDescription>
                Configure as informações do depoimento
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Cliente</FormLabel>
                        <FormControl>
                          <Input placeholder="Maria Silva" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="service"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Serviço Utilizado</FormLabel>
                        <FormControl>
                          <Input placeholder="Terapia Individual" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Depoimento</FormLabel>
                      <FormControl>
                        <Textarea placeholder="O atendimento foi excelente..." rows={4} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="avatar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Avatar</FormLabel>
                        <FormControl>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                              {avatarOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.emoji} {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="rating"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Avaliação (Estrelas)</FormLabel>
                        <FormControl>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">⭐⭐⭐⭐⭐ (5 estrelas)</SelectItem>
                              <SelectItem value="4">⭐⭐⭐⭐ (4 estrelas)</SelectItem>
                              <SelectItem value="3">⭐⭐⭐ (3 estrelas)</SelectItem>
                              <SelectItem value="2">⭐⭐ (2 estrelas)</SelectItem>
                              <SelectItem value="1">⭐ (1 estrela)</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Ativo</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Exibir este depoimento no site
                        </div>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingTestimonial ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-700">
          💡 <strong>Dica:</strong> Arraste e solte os depoimentos para reordenar a exibição no site.
        </p>
      </div>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={testimonials.map(item => item.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {testimonials
              .sort((a, b) => a.order - b.order)
              .map((testimonial) => (
              <SortableTestimonialItem 
                key={testimonial.id} 
                testimonial={testimonial}
                onEdit={() => openEditDialog(testimonial)}
                onDelete={() => deleteMutation.mutate(testimonial.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {testimonials.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Star className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Nenhum depoimento cadastrado ainda.</p>
          <p className="text-sm">Clique em "Novo Depoimento" para começar.</p>
        </div>
      )}
    </div>
  );
}

function SortableTestimonialItem({ testimonial, onEdit, onDelete }: { 
  testimonial: Testimonial; 
  onEdit: () => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: testimonial.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} className="p-4 cursor-move">
      <div className="flex justify-between items-start gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing mt-1 flex-shrink-0">
            <GripVertical className="w-4 h-4 text-gray-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h4 className="font-semibold text-sm sm:text-base truncate">{testimonial.name}</h4>
              <Badge variant={testimonial.isActive ? "default" : "secondary"} className="text-xs flex-shrink-0">
                {testimonial.isActive ? "Ativo" : "Inativo"}
              </Badge>
              <div className="flex">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-600 mb-1">{testimonial.service}</p>
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{testimonial.text}</p>
            <p className="text-xs text-gray-400 mt-1">Ordem: {testimonial.order}</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={onEdit} className="h-8 w-8 sm:w-auto p-0 sm:px-3">
            <Edit className="w-4 h-4" />
            <span className="hidden sm:inline ml-2">Editar</span>
          </Button>
          <Button variant="destructive" size="sm" onClick={onDelete} className="h-8 w-8 sm:w-auto p-0 sm:px-3">
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline ml-2">Excluir</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}
