"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  /** Si es true sólo muestra "Aceptar" (modo alerta). Por defecto false. */
  alertOnly?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: "danger" | "warning" | "primary" | "default";
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  alertOnly = false,
  confirmLabel,
  cancelLabel = "Cancelar",
  confirmColor = "primary",
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  const heading = title ?? (alertOnly ? "Aviso" : "Confirmar acción");
  const okLabel = confirmLabel ?? (alertOnly ? "Aceptar" : "Confirmar");

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <ModalContent>
        <ModalHeader>{heading}</ModalHeader>
        <ModalBody>
          <p>{message}</p>
        </ModalBody>
        <ModalFooter>
          {!alertOnly && (
            <Button variant="light" onPress={onClose}>
              {cancelLabel}
            </Button>
          )}
          <Button color={confirmColor} onPress={handleConfirm}>
            {okLabel}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
